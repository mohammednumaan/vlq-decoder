export default class VLQDecoder {
  static #base64Map = VLQDecoder.#generateBase64IndexTable();

  static #generateBase64IndexTable() {
    const table = {};

    // this constructs a base64 index table/map
    // for reference: https://en.wikipedia.org/wiki/Base64
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    chars.split("").forEach((char, idx) => {
      table[char] = idx;
    });

    return table;
  }

  // this function performs VLQ Base64 decoding
  // for reference: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?tab=t.0#heading=h.djovrt4kdvga
  decode(vlqString, acc = 0, depth = 0, decodedChars = []) {
    // here, a vlqString can be of length > 1
    // so, i need to process the string each character (one-by-one)
    const [firstChar, ...chars] = vlqString;

    // these are the rest of the characters which will be processed later (if exists)
    // for example: string is IAAM, firstChar will be "I" and otherChars will be "AAM"
    const otherChars = chars.join("");

    const index = VLQDecoder.#base64Map[firstChar];

    // the following bitwise logic is very important
    // first i need to check if value has a continuation bit
    // a continuation bit is the MSB and signifies whether there are more bytes
    // after to represent the integer. We can find the continuation bit
    // by performing "&" bitwise operation

    // for example: consider index as 8 (base64 table()), its binary representation is 001000
    // so 001000 & 100000 gives 000000 = 0, so no continuation bit.
    // so 101000 & 100000 gives 100000 = 32 so continuation bit exists
    const hasContinuationBit = index & 32;

    // similarly to extract truncate/remove the continuation bit we perform & operation with 31
    // so 001000 & 011111 gives 001000, truncates 0 (no significant difference here because MSB is already 0)
    // so 101000 & 011111 gives 001000, truncates 1 (the MSB becomes 0)
    const wihoutContinuationBit = index & 31;

    // the next thing we do is shift the value we got above by orders of 5
    // this is because in VLQ encoding, if there is a continuation, we need extra 5 bits to represent it
    // this increases as we need to represent larger and more numbers, hence why we do (5 * depth)
    // for example: 000001 becomes 000001_00000 (the underscore is just to visually understand the original and the added 0's)
    const shifted = wihoutContinuationBit << (5 * depth);
    console.log(shifted.toString(2));
    // here, to get the current value (if it has continuation), we add the previous value with the current one.
    // for example: acc = 10010 and shifted = 100000, we get 110010
    const currentValue = acc + shifted;

    if (hasContinuationBit) {
      return this.decode(otherChars, currentValue, depth + 1, decodedChars);
    }

    // here, i check the value has a negative or positive value
    // this can be easily found by checking the LSB of the value (0 -> pos, 1 -> neg)
    const hasNegativeBit = currentValue & 1;

    // then, if it has negative, we just preprend the negative sign
    // else we return the positive value. Here we shift by 1, because we are removing the LSB/sign bit
    const finalValue = hasNegativeBit
      ? -(currentValue >>> 1)
      : currentValue >>> 1;

    if (!otherChars) {
      return decodedChars.concat(finalValue);
    }

    return this.decode(otherChars, 0, 0, decodedChars.concat(finalValue));
  }
}