import markdown
from docx import Document
from weasyprint import HTML
import os

def export_to_pdf(markdown_text: str, output_path="uploads/output.pdf") -> str:
    # Convert markdown to HTML
    html = markdown.markdown(markdown_text)

    # Generate PDF using WeasyPrint
    HTML(string=html).write_pdf(output_path)
    return output_path

def export_to_docx(markdown_text: str, output_path="uploads/output.docx") -> str:
    doc = Document()
    for line in markdown_text.splitlines():
        doc.add_paragraph(line)
    doc.save(output_path)
    return output_path

def export_to_md(markdown_text: str, output_path="uploads/output.md") -> str:
    with open(output_path, "w") as f:
        f.write(markdown_text)
    return output_path
