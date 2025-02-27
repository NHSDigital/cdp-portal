import { useEffect } from "react";
import styles from "./loader.module.css";
import { Progress } from "./useSubmitUsers";

interface LoadingViewProps {
  progress: Progress;
}

export default function LoadingView({ progress }: LoadingViewProps) {
  useEffect(() => {
    document.title = `Adding user(s)`;
  });
  return (
    <div className="nhsuk-grid-row">
      <div className="nhsuk-grid-column-full nhsuk-u-padding-top-9">
        <div className={styles.loader_container}>
          <h1 className="nhsuk-heading-l">
            {progress.overall == 1
              ? "Adding user"
              : `Adding user ${Math.min(
                  progress.completed + 1,
                  progress.overall
                )} of ${progress.overall}`}
          </h1>
        </div>

        <div className={styles.loader_container}>
          <div className={styles.loader}></div>
        </div>
      </div>
    </div>
  );
}
