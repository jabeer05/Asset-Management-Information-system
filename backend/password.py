import bcrypt

def hash_password(password: str) -> str:
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')  # return as string for storage

def verify_password(password: str, hashed: str) -> bool:
    # Check if the password matches the hash
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

if __name__ == "__main__":
    password = input("Enter your password: ")
    hashed = hash_password(password)
    print("Hashed password:", hashed)

    # Optional: Test verification
    test = input("Re-enter password to verify: ")
    if verify_password(test, hashed):
        print("✅ Password verified!")
    else:
        print("❌ Incorrect password.")
