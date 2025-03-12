import * as crypto from "crypto";

const algorithm = "aes-256-cbc";
const secretKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

export function encrypt(obj: object): string {
    const jsonString = JSON.stringify(obj);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(jsonString, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
};

export function decrypt<T>(encryptedString: string): T {
    const [ivHex, encryptedText] = encryptedString.split(":");
    const decipher = crypto.createDecipheriv(
        algorithm,
        secretKey,
        Buffer.from(ivHex, "hex")
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return JSON.parse(decrypted);
};
