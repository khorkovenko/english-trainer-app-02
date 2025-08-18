import React from 'react';
import { InputText } from "primereact/inputtext";

const FloatingInput = ({
                           id,
                           label,
                           value,
                           onChange,
                           disabled,
                           width = "160px",
                       }) => {
    const numericWidth = parseInt(width, 10);
    const responsiveWidth = `clamp(${numericWidth / 2}px, 50vw, ${numericWidth}px)`;

    return (
        <span
            className="p-float-label"
            style={{
                flex: `0 0 ${responsiveWidth}`,
                minWidth: responsiveWidth,
                display: "inline-flex",
                flexDirection: "column"
            }}
        >
      <InputText
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full"
          placeholder=" "
      />
      <label htmlFor={id}>{label}</label>
    </span>
    );
};

export default FloatingInput;
