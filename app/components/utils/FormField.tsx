import { ChangeEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  CaretDown,
  Eye,
  Info,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";

interface FormFieldProps<T> {
  htmlFor: string;
  type?: string;
  value: string;
  autocomplete?: string;
  placeholder?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  backgroundColour?: string;
  schema?: z.ZodType<T>;
  helperText?: string;
  required?: boolean;
  serverValidationError?: boolean;
  resetField?: boolean;
  min?: number; // Added for integer input
  max?: number; // Added for integer input
  isInteger?: boolean; // Flag to determine if it's an integer input
}

export function FormField<T>({
  htmlFor,
  type = "text",
  value,
  autocomplete,
  placeholder,
  onChange = () => {},
  label,
  backgroundColour = "bg-basePrimary",
  schema,
  helperText,
  required = false,
  serverValidationError = false,
  resetField = false,
  min,
  max,
  isInteger = false,
}: FormFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (resetField) {
      setError(null);
      setIsValid(false);
      setTouched(false);
    }
  }, [resetField]);

  useEffect(() => {
    if (serverValidationError) {
      setError("This field is required");
      setIsValid(false);
      setTouched(true);
    }
  }, [serverValidationError, resetField]);

  const integerSchema = (min?: number, max?: number) =>
    z
      .string()
      .nonempty("This field is required")
      .refine((value) => !isNaN(parseInt(value)), {
        message: "Please enter a valid number",
      })
      .refine(
        (value) => {
          if (min === undefined) return true;
          const numValue = parseInt(value);
          return numValue >= min;
        },
        {
          message: `Minimum value is ${min}`,
        },
      )
      .refine(
        (value) => {
          if (max === undefined) return true;
          const numValue = parseInt(value);
          return numValue <= max;
        },
        {
          message: `Maximum value is ${max}`,
        },
      );

  const validateInput = (value: string) => {
    // If it's an integer input, use integer schema
    const validationSchema = isInteger ? integerSchema(min, max) : schema;

    if (!validationSchema) {
      setIsValid(true);
      setError(null);
      return;
    }

    try {
      if (type === "date") {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (inputDate < today) {
          throw new Error("Date cannot be in the past.");
        }
        validationSchema.parse(inputDate);
      } else {
        validationSchema.parse(value);
      }
      setIsValid(true);
      setError(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setIsValid(false);
      } else if (err instanceof Error) {
        setError(err.message);
        setIsValid(false);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setTouched(true);
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    setIsFocused(false);
    validateInput(e.target.value);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHasValue(newValue.length > 0);
    validateInput(newValue);
    onChange(e);
  };

  const getBorderColor = () => {
    if (error) return "border-dangerPrimary focus:border-dangerPrimary";
    if (isValid && touched) return "border-confirmPrimary";
    return "focus:border-baseSecondary";
  };

  return (
    <div className="relative z-auto space-y-1">
      <div className="relative">
        <input
          type={isInteger ? "number" : type}
          name={htmlFor}
          id={htmlFor}
          aria-label={htmlFor}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={`${htmlFor}-helper ${htmlFor}-error`}
          className={`block text-baseSecondary px-2.5 pb-2.5 pt-3 w-full text-sm 
            ${backgroundColour} rounded-lg border-[1px] 
            ${getBorderColor()}
            focus:outline-none peer transition-all duration-300 
            placeholder:text-baseSecondary placeholder:text-opacity-60
            ${isInteger ? "hide-number-spinner" : ""}`}
          placeholder={isFocused || hasValue ? "" : placeholder}
          autoComplete={autocomplete}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          min={min}
          max={max}
          required={required}
        />

        <label
          htmlFor={htmlFor}
          className={`absolute text-md duration-300 transform -translate-y-4 scale-75 top-1 z-auto origin-[0] 
            inline-flex ${backgroundColour} px-1 peer-focus:px-1 start-1
            opacity-100
            ${error ? "text-dangerPrimary" : "text-baseSecondary"}`}
        >
          {label}
          {required ? " *" : ""}
        </label>

        {type !== "date" && error && (
          <p className="absolute right-2 top-1/2 -translate-y-1/2">
            <WarningCircle className="h-5 w-5 text-dangerPrimary" />
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-1">
          <p
            id={`${htmlFor}-error`}
            className="text-sm text-dangerPrimary px-[1px]"
          >
            {error}
          </p>
        </div>
      )}

      {helperText && !error && (
        <div className="flex items-center space-x-1">
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Info className="h-5 w-5 text-baseSecondary mt-1" />
          </div>
          {isHovered && (
            <div
              id={`${htmlFor}-helper`}
              className="text-sm text-baseSecondary font-primary"
            >
              {helperText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TextAreaFieldProps<T> {
  htmlFor: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  placeholder?: string;
  backgroundColour?: string;
  schema?: z.ZodType<T>;
  helperText?: string;
  required?: boolean;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  serverValidationError: boolean;
  resetField: boolean;
}

export function TextAreaField<T>({
  htmlFor,
  value,
  onChange,
  label,
  placeholder = "",
  backgroundColour = "bg-basePrimary",
  schema,
  helperText,
  required = false,
  maxLength,
  minRows = 6,
  maxRows = 18,
  serverValidationError,
  resetField = false,
}: TextAreaFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTouched(false);
    setError(null);
  }, [resetField]);

  useEffect(() => {
    if (serverValidationError) {
      setError("This field is required");
      // console.log("Server validation component", error);
      return;
    }
  }, [serverValidationError]);

  const validateInput = (value: string) => {
    if (!schema) {
      setIsValid(true);
      setError(null);
      return;
    }

    try {
      schema.parse(value);
      setIsValid(true);
      setError(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setIsValid(false);
      }
    }
  };

  // Auto-resize textarea

  useEffect(() => {
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = "auto";
      const singleLineHeight = 40;
      const minHeight = singleLineHeight * minRows;
      const maxHeight = singleLineHeight * maxRows;

      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

      textarea.style.height = `${newHeight}px`;
    };
    adjustHeight();
  }, [value, minRows, maxRows]);

  const handleFocus = () => {
    setIsFocused(true);
    setTouched(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Handle maxLength restriction
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    setHasValue(newValue.length > 0);
    validateInput(newValue);
    onChange(e);
  };

  // Calculate character count and remaining
  const charCount = value.length;
  const remainingChars = maxLength ? maxLength - charCount : null;
  const isNearLimit = maxLength
    ? remainingChars! < Math.ceil(maxLength * 0.1)
    : false;

  return (
    <div className="relative z-autospace-y-1">
      <div className="relative ">
        <textarea
          ref={textareaRef}
          name={htmlFor}
          id={htmlFor}
          aria-label={htmlFor}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={`${htmlFor}-helper ${htmlFor}-error ${htmlFor}-count`}
          className={`block text-baseSecondary px-2.5 pb-2.5 pt-4 w-full text-sm 
            ${backgroundColour} rounded-lg border-[1px] resize-none overflow-hidden
            ${error ? "border-dangerPrimary focus:border-dangerPrimary" : "focus:border-baseSecondary"} 
            ${isValid && touched ? "border-confirmPrimary" : ""}
            focus:outline-none peer transition-all duration-300 
            placeholder:text-baseSecondary placeholder:text-opacity-60 `}
          placeholder={isFocused || hasValue ? "" : placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
        />
        <label
          htmlFor={htmlFor}
          className={`absolute text-md text-baseSecondary duration-300 transform -translate-y-4 scale-75 top-1 z-auto origin-[0] 
            ${backgroundColour} px-2 peer-focus:px-2 peer-focus:text-baseSecondary start-1
            ${"opacity-100"}
            ${error ? "text-dangerPrimary" : ""}`}
        >
          {label}
          {required ? " *" : ""}
        </label>

        {error && (
          <p className="absolute right-2 top-2">
            <WarningCircle className="h-5 w-5" />
          </p>
        )}
      </div>

      <div className="flex justify-between items-center ">
        <div className="flex-1">
          {error && (
            <div className="flex items-center space-x-1">
              <p id={`${htmlFor}-error`} className="text-sm text-dangerPrimary">
                {error}
              </p>
            </div>
          )}
          {helperText && (
            <div className="flex items-center space-x-1">
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Info className="h-5 w-5 text-baseSecondary" />
              </div>
              {isHovered && (
                <div
                  id={`${htmlFor}-helper`}
                  className="text-sm text-baseSecondary font-primary"
                >
                  {helperText}
                </div>
              )}
            </div>
          )}
        </div>

        <div id={`${htmlFor}-count`}>
          {maxLength ? (
            <span
              className={`text-sm ${isNearLimit ? "text-dangerPrimary" : "text-baseSecondary"}`}
            >
              {remainingChars} characters remaining
            </span>
          ) : (
            <span
              className={`text-sm ${isNearLimit ? "text-dangerPrimary" : "text-baseSecondary"}`}
            >
              {charCount} characters
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface RadioOptionProps {
  value: string;
  label: string;
  onChange: (role: string) => void;
  isSelected?: boolean;
  description?: string;
}
export const RadioOption = ({
  value,
  label,
  isSelected,
  onChange,
  description,
}: RadioOptionProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Allow the user to select via "Enter" or "Space" keys
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(value);
    }
  };
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0} // Make the component focusable
      onKeyDown={handleKeyDown} // Keyboard support
      className={`flex items-center p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
        isSelected
          ? "border-baseSecondary shadow-md"
          : " hover:border-baseSecondary border-basePrimaryDark "
      }`}
      onClick={() => onChange(value)}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
          isSelected
            ? "border-basePrimaryDark bg-basePrimaryDark"
            : "border-basePrimaryDark"
        }`}
      >
        {isSelected && (
          <div className="w-4 h-4 rounded-full bg-baseSecondary"></div>
        )}
      </div>
      <div>
        <span
          className={`text-lg ${isSelected ? " font-semibold" : "text-basePrimaryDark"}`}
        >
          {label}
        </span>
        <p
          className={`text-xs ${isSelected ? " font-semibold" : "text-basePrimaryDark"}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

interface ListInputProps {
  inputtedList: string[];
  availableOptions?: string[];
  onInputsChange: (inputtedList: string[]) => void;
  placeholder?: string;
  allowCustomOptions?: boolean;
  useDefaultListStyling?: boolean;
  inputLimit?: number;
  errorMessage: string;
  helperText?: string;
  serverValidationError?: boolean;
  resetField: boolean;
  label?: string;
  required?: boolean;
  htmlFor?: string;
  backgroundColour?: string;
}

export const ListInput = ({
  inputtedList,
  availableOptions = [],
  onInputsChange,
  placeholder = "Enter an input",
  allowCustomOptions = true,
  useDefaultListStyling = true,
  inputLimit = Infinity,
  errorMessage,
  helperText,
  serverValidationError,
  resetField,
  label,
  required = false,
  htmlFor,
  backgroundColour = "bg-basePrimaryLight",
}: ListInputProps) => {
  const [newOption, setNewOption] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setHasInteracted(false);
    setError("");
  }, [resetField]);

  useEffect(() => {
    if (serverValidationError) {
      setError("This field is required");
      setHasInteracted(true);
      console.log("Server validation component", error);
      return;
    }
  }, [serverValidationError, error]);
  // Update validation state when list changes
  useEffect(() => {
    if (hasInteracted) {
      const isEmpty = inputtedList.length === 0;
      setIsValid(!isEmpty);

      // Clear limit error when list becomes empty
      if (isEmpty) {
        setError("");
      }
    }
  }, [inputtedList, hasInteracted]);

  const handleFocus = () => {
    setIsDropdownVisible(true);
    setTouched(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      if (touched) {
        setHasInteracted(true);
        setIsValid(inputtedList.length > 0);
      }
      setIsDropdownVisible(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewOption(value);
    // Only clear error if it's not a "field required" error
    if (error && !error.includes("required")) {
      setError("");
    }

    if (value.trim() === "" || !availableOptions.length) {
      setFilteredOptions([]);
      setIsDropdownVisible(false);
    } else {
      const filtered = availableOptions.filter(
        (input) =>
          input.toLowerCase().includes(value.toLowerCase()) &&
          !inputtedList.includes(input),
      );
      setFilteredOptions(filtered);
      setIsDropdownVisible(true);
    }
  };

  const addInput = (input: string) => {
    const trimmedOption = input.trim();
    setHasInteracted(true);

    if (trimmedOption === "") {
      setIsValid(false);
      return;
    }

    if (availableOptions.length && !availableOptions.includes(trimmedOption)) {
      if (!allowCustomOptions) {
        setError(`"${trimmedOption}" is not a valid input`);
        return;
      }
    }

    if (!inputtedList.includes(trimmedOption)) {
      if (inputtedList.length >= inputLimit) {
        setError(`Maximum limit of ${inputLimit} items reached`);
        setNewOption("");
        setIsDropdownVisible(false);
        setFilteredOptions([]);
        inputRef.current?.focus();
        return;
      }

      onInputsChange([...inputtedList, trimmedOption]);
      setNewOption("");
      setFilteredOptions([]);
      setIsDropdownVisible(false);
      setError("");
      setIsValid(true);
    } else {
      setError(`"${trimmedOption}" is already added`);
    }
  };

  const removeTag = (inputToRemove: string) => {
    const updatedList = inputtedList.filter((input) => input !== inputToRemove);
    onInputsChange(updatedList);
    setHasInteracted(true);

    if (updatedList.length === 0) {
      setIsValid(false);
      setError("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInput(newOption);
    } else if (e.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

  const getBorderColorClass = () => {
    if (!hasInteracted) return "border-baseSecondary";
    return inputtedList.length > 0
      ? "border-confirmPrimary"
      : "border-dangerPrimary";
  };

  const remainingItems = inputLimit - inputtedList.length;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex">
          {label && (
            <label
              htmlFor={htmlFor}
              className={`absolute text-md text-baseSecondary duration-300 transform -translate-y-4 scale-75 top-1 z-auto origin-[0] 
                ${backgroundColour} px-2 peer-focus:px-2 peer-focus:text-baseSecondary start-1
                opacity-100
                ${!isValid && hasInteracted ? "text-dangerPrimary" : ""}`}
            >
              {label}
              {required ? " *" : ""}
            </label>
          )}
          <input
            ref={inputRef}
            type="text"
            id={htmlFor}
            value={newOption}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={!isValid}
            className={`block text-baseSecondary px-2.5 pb-2.5 pt-4 w-full text-sm ${backgroundColour} rounded-l-md border-[1px] focus:outline-none peer transition-all duration-300 placeholder:text-baseSecondary placeholder:text-opacity-60 ${getBorderColorClass()}`}
            placeholder={
              inputLimit !== Infinity
                ? `${placeholder} (${remainingItems} remaining)`
                : placeholder
            }
          />

          <button
            type="button"
            onClick={() => addInput(newOption)}
            className="bg-baseSecondary text-basePrimaryLight px-4 rounded-r-md transition-colors"
          >
            Add
          </button>
        </div>
        {!isValid && hasInteracted && !error && (
          <span className="text-dangerPrimary text-sm mt-1 block">
            {error || errorMessage || "This field is required."}
          </span>
        )}
        {error && (
          <span className="text-dangerPrimary text-sm mt-1 block">{error}</span>
        )}

        {helperText && !error && (
          <div className="flex items-center space-x-1 mt-[3px]">
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Info className="h-5 w-5 text-baseSecondary" />
            </div>
            {isHovered && (
              <div className="text-sm text-baseSecondary font-primary">
                {helperText}
              </div>
            )}
          </div>
        )}

        {isDropdownVisible && filteredOptions.length > 0 && (
          <ul
            ref={dropdownRef}
            className="absolute left-0 w-full border rounded-lg border-baseSecondary mt-2 max-h-60 overflow-auto z-50 bg-basePrimaryLight"
          >
            {filteredOptions.map((input, index) => (
              <button
                key={index}
                onClick={() => addInput(input)}
                className="p-2 cursor-pointer transition-colors flex flex-col text-baseSecondary hover:text-basePrimary hover:bg-baseSecondary w-full"
              >
                {input}
              </button>
            ))}
          </ul>
        )}
      </div>

      {useDefaultListStyling && (
        <div className="flex flex-wrap gap-2">
          {inputtedList.map((input, index) => (
            <span
              key={index}
              className="bg-baseSecondary text-basePrimaryLight px-3 py-1 rounded-full flex items-center"
            >
              {input}
              <button
                type="button"
                onClick={() => removeTag(input)}
                className="ml-2 text-xs bg-dangerPrimary rounded-full w-4 h-4 flex items-center justify-center hover:bg-dangerPrimary transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const FilePreviewButton = ({
  fileUrl,
  fileName,
  fileSize,
  fileExtension,
  onDelete,
  isEditing,
}: {
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileExtension: string | null;
  onDelete?: (file: string) => void;
  isEditing: boolean;
}) => {
  const convertBytes = (bytes: number): string => {
    const units = ["bytes", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // State to store the signed URL
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);
  // Fetch the signed URL when the component mounts
  useEffect(() => {
    async function fetchSignedUrl() {
      const res = await fetch(`/api/s3-get-url?file=${fileUrl}&action=upload`);
      const data = await res.json();
      if (data.url) {
        setSignedFileUrl(data.url);
      }
    }
    fetchSignedUrl();
  }, [fileUrl]);

  const handleFilePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (signedFileUrl) {
      window.open(signedFileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const truncateFileName = (name: string, limit: number) => {
    if (name.length <= limit) return name;
    return `${name.slice(0, limit)}...`;
  };

  const handleFileDelete = (e: React.MouseEvent) => {
    onDelete?.(fileUrl);
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <>
      <button
        onClick={handleFilePreview}
        className={`group relative w-full max-w-sm transition-all duration-200 
                 ${fileUrl ? "hover:shadow-lg cursor-pointer" : "cursor-not-allowed opacity-75"} 
                 focus:outline-none focus:ring-2 focus:ring-baseSecondary focus:ring-offset-2
                 z-10`}
        disabled={!fileUrl}
        aria-label={`Preview ${fileName}`}
        title={!fileUrl ? "No preview available" : undefined}
      >
        <div
          className="flex overflow-hidden rounded-lg border border-basePrimaryDark
                    bg-basePrimaryLight hover:bg-basePrimary transition-colors duration-200"
        >
          {/* File Extension Badge */}
          <div
            className="flex min-w-16 items-center justify-center bg-baseSecondary 
                      p-3 font-medium text-basePrimaryDark"
          >
            {fileExtension?.toUpperCase() || "?"}
          </div>
          {/* File Information */}
          <div className="flex flex-1 flex-col justify-between p-3">
            <div className="space-y-1">
              <p className="font-medium text-baseSecondary text-sm text-left">
                {fileName ? truncateFileName(fileName, 40) : "Unnamed File"}
              </p>
              <p className="text-xs text-baseSecondary text-opacity-75">
                {fileSize ? convertBytes(fileSize) : "Unknown size"}
              </p>
            </div>
          </div>

          {/* Preview Icon */}
          <div
            className="flex items-center pr-4 opacity-0 transition-opacity 
                      group-hover:opacity-100"
          >
            <Eye size={20} className="text-baseSecondary" />
          </div>
        </div>
      </button>
      {isEditing && (
        <button className="ml-2" onClick={handleFileDelete}>
          <Trash size={20} className="text-dangerPrimary" />
        </button>
      )}
    </>
  );
};

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownFieldProps<T> {
  htmlFor: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  backgroundColour?: string;
  schema?: z.ZodType<T>; // Updated to use generic type
  helperText?: string;
  required?: boolean;
  serverValidationError?: boolean;
  resetField?: boolean;
  placeholder?: string;
}

export function DropdownField<T>({
  htmlFor,
  value,
  options,
  onChange,
  label,
  backgroundColour = "bg-basePrimaryDark",
  schema,
  helperText,
  required = false,
  serverValidationError = false,
  resetField = false,
  placeholder = "Select an option",
}: DropdownFieldProps<T>) {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (resetField) {
      setError(null);
      setIsValid(false);
      setTouched(false);
    }
  }, [resetField]);

  useEffect(() => {
    if (serverValidationError) {
      setError("This field is required");
      setIsValid(false);
      setTouched(true);
    }
  }, [serverValidationError, resetField]);

  const validateInput = (value: string) => {
    if (!schema) {
      setIsValid(true);
      setError(null);
      return;
    }

    try {
      schema.parse(value);
      setIsValid(true);
      setError(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setIsValid(false);
      }
    }
  };

  const handleSelect = (selectedValue: string) => {
    setTouched(true);
    validateInput(selectedValue);
    onChange(selectedValue);
    setIsOpen(false);
  };

  const getBorderColor = () => {
    if (error) return "border-dangerPrimary focus:border-dangerPrimary";
    if (isValid && touched) return "border-confirmPrimary";
    return "focus:border-baseSecondary";
  };

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "";

  return (
    <div ref={dropdownRef} className="relative text-baseSecondary ">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex justify-between items-center w-full text-left text-baseSecondary px-2.5 pb-2.5 pt-3 text-sm 
            ${backgroundColour} rounded-lg border-[1px] 
            ${getBorderColor()}
            focus:outline-none transition-all duration-300`}
        >
          <span className={`${!selectedLabel ? "text-opacity-60" : ""}`}>
            {selectedLabel || placeholder}
          </span>
          <CaretDown
            size={16}
            className={`transition-transform ${isOpen ? "transform rotate-180" : ""}`}
          />
        </button>

        <label
          htmlFor={htmlFor}
          className={`absolute text-md duration-300 transform -translate-y-4 scale-75 top-1  origin-[0] 
            inline-flex ${backgroundColour} px-1 peer-focus:px-1 start-1
            opacity-100
            ${error ? "text-dangerPrimary" : "text-baseSecondary"}`}
        >
          {label}
          {required ? " *" : ""}
        </label>

        {isOpen && (
          <ul
            role="listbox"
            className="absolute left-0 w-full mt-1 border rounded-lg border-baseSecondary  bg-basePrimaryLight max-h-60 overflow-y-auto  z-50"
          >
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                tabIndex={0}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.value);
                  }
                }}
                className="px-4 py-2 cursor-pointer text-baseSecondary hover:bg-baseSecondary hover:text-basePrimaryLight transition-colors focus:outline-none focus:bg-baseSecondary focus:text-basePrimaryLight"
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <WarningCircle className="h-5 w-5" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-1">
          <p className="text-sm text-dangerPrimary px-[1px]">{error}</p>
        </div>
      )}

      {helperText && !error && (
        <div className="flex items-center space-x-1">
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Info className="h-5 w-5 text-baseSecondary" />
          </div>
          {isHovered && (
            <div className="text-sm text-baseSecondary font-primary">
              {helperText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
