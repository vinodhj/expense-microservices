#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Default file names
const DEFAULT_INPUT_FILE = "supergraph.graphql";
const DEFAULT_OUTPUT_FILE = "supergraph-string.js";

// Get command line arguments
const args = process.argv.slice(2);
const inputFile = args[0] || DEFAULT_INPUT_FILE;
const outputFile = args[1] || DEFAULT_OUTPUT_FILE;

// Convert GraphQL schema to JavaScript
function convertGraphQLToJS(inputFilePath, outputFilePath) {
  try {
    // Read the GraphQL schema file
    const schemaContent = fs.readFileSync(inputFilePath, "utf8");

    // Process the schema content
    let processedContent = schemaContent;

    // Replace triple-quoted comments with GraphQL # comments
    processedContent = processedContent.replace(/"""\s*([\s\S]*?)\s*"""/g, (match, commentContent) => {
      // Convert to single-line comments with #
      return commentContent
        .split("\n")
        .map((line) => {
          const trimmedLine = line.trim();
          return trimmedLine ? `# ${trimmedLine}` : "#";
        })
        .join("\n");
    });

    // Handle specific enum comment format for link__Purpose and similar structures
    processedContent = processedContent.replace(/enum\s+(\w+)\s*{([^}]*)}/g, (match, enumName, enumContent) => {
      // Process enum content to ensure proper formatting of comments
      const processedEnumContent = enumContent.replace(/\s*(\w+)\s+#\s*(.*?)(?=\n\s*\w|\n\s*}|$)/g, (match, enumValue, comment) => {
        return `\n  # ${comment}\n  ${enumValue}`;
      });

      return `enum ${enumName} {${processedEnumContent}\n}`;
    });

    // Clean up any double comment markers that might have been created
    processedContent = processedContent.replace(/#+\s+#/g, "#");

    // Remove any extra whitespace and normalize indentation
    processedContent = processedContent.trim();

    // Escape any backticks in the content to avoid breaking the template literal
    processedContent = processedContent.replace(/`/g, "\\`");

    // Create JavaScript export using the preferred format
    const jsContent = `export const supergraphSdl = /* GraphQL */ \`${processedContent}\`;`;

    // Write to output file
    fs.writeFileSync(outputFilePath, jsContent);

    console.log(`Successfully converted ${inputFilePath} to ${outputFilePath}`);
    return true;
  } catch (error) {
    console.error(`Error converting schema: ${error.message}`);
    return false;
  }
}

// Run the conversion
convertGraphQLToJS(inputFile, outputFile);
