import crypto from "crypto";
import { config } from "@main/config";

const ENCRYPTION_KEY = config.encryptionKey;
const ALGORITHM_DETERMINISTIC = "aes-256-cbc";
const ALGORITHM_GCM = "aes-256-gcm";
const IV_LENGTH_GCM = 12;

// Determine static IV for deterministic encryption based on the key
const staticIv = crypto
    .createHash("sha256")
    .update(ENCRYPTION_KEY)
    .digest()
    .slice(0, 16);

/**
 * Encrypts data deterministically (always produces the same ciphertext for the same plaintext).
 * This is crucial for searchable fields like 'email'.
 */
export const encryptDeterministic = (text: string): string => {
    if (!text) return text;

    const cipher = crypto.createCipheriv(
        ALGORITHM_DETERMINISTIC,
        Buffer.from(ENCRYPTION_KEY),
        staticIv
    );
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `enc:det:${encrypted}`;
};

/**
 * Decrypts deterministic data.
 */
export const decryptDeterministic = (text: string): string => {
    if (!text || !text.startsWith("enc:det:")) return text;

    const actualCiphertext = text.replace("enc:det:", "");
    const decipher = crypto.createDecipheriv(
        ALGORITHM_DETERMINISTIC,
        Buffer.from(ENCRYPTION_KEY),
        staticIv
    );
    let decrypted = decipher.update(actualCiphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};

/**
 * Encrypts data non-deterministically using GCM (more secure, but not directly searchable).
 * Ideal for fields like 'name', 'DOB'.
 */
export const encryptGCM = (text: string): string => {
    if (!text) return text;

    const iv = crypto.randomBytes(IV_LENGTH_GCM);
    const cipher = crypto.createCipheriv(
        ALGORITHM_GCM,
        Buffer.from(ENCRYPTION_KEY),
        iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Format: enc:gcm:iv:authTag:ciphertext
    return `enc:gcm:${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Decrypts GCM encrypted data.
 */
export const decryptGCM = (text: string): string => {
    if (!text || !text.startsWith("enc:gcm:")) return text;

    const parts = text.split(":");
    if (parts.length !== 5) return text;

    const [, , ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(
        ALGORITHM_GCM,
        Buffer.from(ENCRYPTION_KEY),
        iv
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};
