import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCloudinaryUrl, cloudinaryLoader } from "../src/lib/image-loader.ts";

describe("Cloudinary Image Loader", () => {
  it("transforms standard Cloudinary upload URL with f_auto, q_auto, and w_${width}", () => {
    const input = "https://res.cloudinary.com/nvdatzmv/image/upload/v1729000000/rawnq/products/sample.jpg";
    const result = cloudinaryLoader({ src: input, width: 640 });
    assert.equal(
      result,
      "https://res.cloudinary.com/nvdatzmv/image/upload/f_auto,q_auto,w_640,c_limit/v1729000000/rawnq/products/sample.jpg"
    );
  });

  it("handles custom quality parameter", () => {
    const input = "https://res.cloudinary.com/nvdatzmv/image/upload/v1729000000/rawnq/products/sample.jpg";
    const result = cloudinaryLoader({ src: input, width: 1080, quality: 80 });
    assert.equal(
      result,
      "https://res.cloudinary.com/nvdatzmv/image/upload/f_auto,q_80,w_1080,c_limit/v1729000000/rawnq/products/sample.jpg"
    );
  });

  it("replaces existing transformations without duplicating them", () => {
    const input = "https://res.cloudinary.com/nvdatzmv/image/upload/f_auto,q_auto/v1729000000/rawnq/products/sample.jpg";
    const result = formatCloudinaryUrl(input, { width: 320 });
    assert.equal(
      result,
      "https://res.cloudinary.com/nvdatzmv/image/upload/f_auto,q_auto,w_320,c_limit/v1729000000/rawnq/products/sample.jpg"
    );
  });

  it("falls back to Next.js image endpoint for local assets", () => {
    const local = "/products/jug.jpg";
    const result = cloudinaryLoader({ src: local, width: 640 });
    assert.equal(result, "/_next/image?url=%2Fproducts%2Fjug.jpg&w=640&q=75");
  });

  it("returns invalid or empty URLs safely without throwing", () => {
    assert.equal(formatCloudinaryUrl(""), "");
    // @ts-expect-error testing invalid input
    assert.equal(formatCloudinaryUrl(null), null);
  });
});
