from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import sys

# Initialize the PasswordHasher with secure, recommended defaults (Argon2id)
ph = PasswordHasher()

# Use sys.argv for command line input or fall back to interactive input
if len(sys.argv) > 1:
    password_to_hash = sys.argv[1]
else:
    password_to_hash = input("Enter password to hash: ")

try:
    # Hash the password
    hashed_password = ph.hash(password_to_hash)
    print(f"Hashed Password (Argon2): {hashed_password}")

    # --- How you would verify later in your application ---
    # is_correct = ph.verify(hashed_password, password_to_hash)
    # print(f"Verification successful: {is_correct}")

except VerifyMismatchError:
    print("Verification failed.")
except Exception as e:
    print(f"An error occurred: {e}")