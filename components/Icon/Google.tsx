type SVGRProps = {
  title?: string;
  titleId?: string;
};
const SvgGoogle = ({ title, titleId }: SVGRProps) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby={titleId}
  >
    {title ? <title id={titleId}>{title}</title> : null}
    <path
      d="M24 3C12.403 3 3 12.403 3 24s9.403 21 21 21 21-9.403 21-21S35.597 3 24 3Zm7.828 29.7c-1.903 1.753-4.5 2.784-7.598 2.784A11.476 11.476 0 0 1 12.75 24c0-1.856.445-3.61 1.223-5.16 1.89-3.756 5.77-6.33 10.257-6.33 3.093 0 5.69 1.14 7.683 2.992l-3.291 3.295c-1.19-1.14-2.705-1.716-4.388-1.716-2.99 0-5.522 2.02-6.426 4.735-.23.689-.361 1.425-.361 2.184 0 .76.131 1.495.36 2.184.905 2.714 3.437 4.735 6.423 4.735 1.547 0 2.86-.408 3.886-1.097a5.278 5.278 0 0 0 2.292-3.469H24.23V21.91h10.814c.136.755.206 1.538.206 2.349 0 3.501-1.252 6.44-3.422 8.442Z"
      fill="#currentColor"
    />
  </svg>
);
export default SvgGoogle;
