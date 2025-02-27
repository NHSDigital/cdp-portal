import { useEffect, useState } from "react";

export default function useHasJavascript() {
  const [hasJavascript, setHasJavascript] = useState(false);
  useEffect(() => {
    setHasJavascript(true);
  }, [setHasJavascript]);
  return hasJavascript;
}
