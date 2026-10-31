import { useEffect, useState } from "react";

/* An <img> that shows a "No image" label if the picture is missing or broken. */
export default function SafeImage({ src, alt = "", fallback = "No image", ...rest }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <span className="noimg">{fallback}</span>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} {...rest} />;
}
