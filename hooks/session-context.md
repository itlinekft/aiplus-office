AI+ Iroda (the aiplus-office plugin) is installed in this session.
- For any Word, Excel, PowerPoint or PDF file (make, edit, fill a template, convert, read back), load the `aiplus-office:office-router` skill first, or the app skill it names (`office-wordcraft`, `office-gridcraft`, `office-deckcraft`, `office-pdfcraft`), and work through it.
- Do not start with Python, openpyxl, python-docx, Excel or Word automation, LibreOffice or a hand-built ZIP or XML file.
- If the module cannot run (Node.js missing, a download failed), follow the router's "When the module cannot run" section: stop and say so; make the file another way only if the user then asks for it. When Node.js is missing, `aiplus-office:office-start` offers to install it (only after the user's yes, from the official source).
- First-run and setup questions („hogyan kezdjem?”, "how do I start?") go to `aiplus-office:office-start`.
