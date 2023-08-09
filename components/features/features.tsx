import { useId } from "react";
import styles from "./features.module.css";


export function Feature({ label }) {
  return (
    <div className={styles.feature}>
      <h4>{label}</h4>
    </div>
  );
}

const FEATURES_LIST = [
  { label: "lorem ipsum a" },
  { label: "lorem ipsum b" },
  { label: "lorem ipsum c" },
  { label: "lorem ipsum d" },
  { label: "lorem ipsum e" },
  { label: "lorem ipsum f" },
  { label: "lorem ipsum g" },
  { label: "lorem ipsum h" }
];

export function Features() {
  const id = useId<string>()

  return (
    <div className="mx-auto max-w-full w-[880px] text-center px-4 mb-10">
      <p className="text-lg mb-2 text-gray-600 md:!text-2xl">Your gaming blockchain</p>
      <div className={styles.features}>
        {FEATURES_LIST.map(({ label }) => (
          <Feature label={label} key={id + label} />
        ))}
      </div>
    </div>
  );
}