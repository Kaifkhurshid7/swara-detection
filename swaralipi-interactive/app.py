import subprocess
import sys
import threading
import os
import signal

def run_command(command, cwd, prefix=""):
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        text=True,
        bufsize=1,
        shell=True,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
    )
    for line in iter(process.stdout.readline, ''):
        sys.stdout.write(f"[{prefix}] {line}")
        sys.stdout.flush()
    process.stdout.close()
    process.wait()

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dir = os.path.join(base_dir, 'frontend')

    print("Starting Swaralipi Backend and Frontend...")

    # Use the existing run.bat scripts to handle env setup and dependency installation
    backend_thread = threading.Thread(target=run_command, args=(['run.bat'], backend_dir, 'BACKEND'))
    frontend_thread = threading.Thread(target=run_command, args=(['run.bat'], frontend_dir, 'FRONTEND'))

    backend_thread.daemon = True
    frontend_thread.daemon = True

    backend_thread.start()
    frontend_thread.start()

    try:
        # Keep the main thread alive to catch KeyboardInterrupt
        while backend_thread.is_alive() or frontend_thread.is_alive():
            backend_thread.join(1)
            frontend_thread.join(1)
    except KeyboardInterrupt:
        print("\nShutting down Swaralipi...")
        sys.exit(0)

if __name__ == '__main__':
    main()
