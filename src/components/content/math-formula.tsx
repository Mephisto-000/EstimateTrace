import katex from "katex";

type MathFormulaProps = {
  readonly expression: string;
  readonly label: string;
  readonly display?: boolean;
  readonly className?: string;
};

function renderMath(expression: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(expression, {
      displayMode,
      maxExpand: 1_000,
      maxSize: 10,
      output: "html",
      strict: "error",
      throwOnError: true,
      trust: false,
    });
  } catch {
    return null;
  }
}

export function MathFormula({
  expression,
  label,
  display = false,
  className,
}: MathFormulaProps) {
  const markup = renderMath(expression, display);
  const classes = [
    "math-formula",
    display ? "math-formula--display" : "math-formula--inline",
    markup === null ? "math-formula--fallback" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content =
    markup === null ? (
      <code aria-hidden="true">{expression}</code>
    ) : (
      <span
        aria-hidden="true"
        className="math-formula__rendered"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );

  if (display) {
    return (
      <div
        aria-label={label}
        className={classes}
        data-math-renderer={markup === null ? "text" : "katex"}
        role="math"
        tabIndex={0}
      >
        {content}
      </div>
    );
  }

  return (
    <span
      aria-label={label}
      className={classes}
      data-math-renderer={markup === null ? "text" : "katex"}
      role="math"
    >
      {content}
    </span>
  );
}
