import { Fragment } from "react";
import { loadDefaultJapaneseParser } from "budoux";

const japaneseParser = loadDefaultJapaneseParser();

export function JapaneseText({ children }: { children: string }) {
  const phrases = japaneseParser.parse(children);

  return (
    <span className="jaPhrase">
      {phrases.map((phrase, index) => (
        <Fragment key={`${phrase}-${index}`}>
          <span className="jaChunk">{phrase}</span>
          {index < phrases.length - 1 && <wbr />}
        </Fragment>
      ))}
    </span>
  );
}
