import {
    encryptDeterministic,
    decryptDeterministic,
    encryptGCM,
    decryptGCM,
} from "@infrastructure/services/crypto";

describe("Crypto Utilities", () => {
    describe("Deterministic Encryption", () => {
        it("should encrypt and decrypt a string correctly", () => {
            const plaintext = "test@example.com";
            const encrypted = encryptDeterministic(plaintext);
            const decrypted = decryptDeterministic(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it("should produce the same ciphertext for the same input", () => {
            const plaintext = "deterministic-test";
            const enc1 = encryptDeterministic(plaintext);
            const enc2 = encryptDeterministic(plaintext);

            expect(enc1).toBe(enc2);
        });

        it("should prefix ciphertext with enc:det:", () => {
            const encrypted = encryptDeterministic("hello");
            expect(encrypted).toMatch(/^enc:det:/);
        });

        it("should return empty/falsy values unchanged", () => {
            expect(encryptDeterministic("")).toBe("");
            expect(decryptDeterministic("")).toBe("");
        });

        it("should return non-prefixed strings unchanged on decrypt", () => {
            expect(decryptDeterministic("plaintext")).toBe("plaintext");
        });
    });

    describe("GCM Encryption", () => {
        it("should encrypt and decrypt a string correctly", () => {
            const plaintext = "sensitive data";
            const encrypted = encryptGCM(plaintext);
            const decrypted = decryptGCM(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it("should produce different ciphertext on each call (non-deterministic)", () => {
            const plaintext = "same input";
            const enc1 = encryptGCM(plaintext);
            const enc2 = encryptGCM(plaintext);

            expect(enc1).not.toBe(enc2);
        });

        it("should prefix ciphertext with enc:gcm:", () => {
            const encrypted = encryptGCM("hello");
            expect(encrypted).toMatch(/^enc:gcm:/);
        });

        it("should have 5 parts separated by colons", () => {
            const encrypted = encryptGCM("test");
            const parts = encrypted.split(":");
            expect(parts.length).toBe(5);
        });

        it("should return empty/falsy values unchanged", () => {
            expect(encryptGCM("")).toBe("");
            expect(decryptGCM("")).toBe("");
        });

        it("should return non-prefixed strings unchanged on decrypt", () => {
            expect(decryptGCM("plaintext")).toBe("plaintext");
        });

        it("should return malformed enc:gcm: strings unchanged", () => {
            expect(decryptGCM("enc:gcm:only-two-parts")).toBe(
                "enc:gcm:only-two-parts",
            );
        });
    });
});
