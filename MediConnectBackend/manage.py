#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    # ✅ FIX: Intercept output to make 0.0.0.0 clickable on Windows
    if 'runserver' in sys.argv:
        class LinkFixerStdout:
            def __init__(self, original_stdout):
                self.original_stdout = original_stdout
            def write(self, text):
                if "Starting development server at http://0.0.0.0:" in text:
                    text = text.replace("http://0.0.0.0:", "http://127.0.0.1:")
                self.original_stdout.write(text)
            def flush(self):
                self.original_stdout.flush()
            def __getattr__(self, name):
                return getattr(self.original_stdout, name)
        
        sys.stdout = LinkFixerStdout(sys.stdout)

    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
