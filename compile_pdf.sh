#!/bin/bash

# Compile LaTeX executive summary to PDF
echo "Compiling executive summary to PDF..."

# Check if pdflatex is installed
if ! command -v pdflatex &> /dev/null; then
    echo "pdflatex not found. Please install a LaTeX distribution (e.g., MacTeX for macOS)"
    echo "You can install it with: brew install --cask mactex"
    exit 1
fi

# Compile the enhanced version
pdflatex -interaction=nonstopmode executive_summary_enhanced.tex
pdflatex -interaction=nonstopmode executive_summary_enhanced.tex # Run twice for proper references

# Clean up auxiliary files
rm -f *.aux *.log *.out

echo "✅ PDF generated: executive_summary_enhanced.pdf"
echo ""
echo "For the Markdown version, you can use:"
echo "  - VS Code with Markdown PDF extension"
echo "  - pandoc: pandoc executive_summary.md -o executive_summary.pdf"
echo "  - Online: hackmd.io or dillinger.io"
