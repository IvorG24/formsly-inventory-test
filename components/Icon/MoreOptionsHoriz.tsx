type SVGRProps = {
  title?: string;
  titleId?: string;
};
const SvgMoreOptionsHoriz = ({ title, titleId }: SVGRProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    height="1em"
    width="1em"
    role="img"
    aria-labelledby={titleId}
  >
    {title ? <title id={titleId}>{title}</title> : null}
    <path
      d="M10.4 26.4q-1 0-1.7-.7T8 24q0-1 .7-1.7t1.7-.7q1 0 1.7.7t.7 1.7q0 1-.7 1.7t-1.7.7Zm13.6 0q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7t1.7-.7q1 0 1.7.7t.7 1.7q0 1-.7 1.7t-1.7.7Zm13.6 0q-1 0-1.7-.7t-.7-1.7q0-1 .7-1.7t1.7-.7q1 0 1.7.7T40 24q0 1-.7 1.7t-1.7.7Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgMoreOptionsHoriz;
