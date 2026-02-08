import { Globe } from "lucide-react";
import { FormEvent } from "react";

interface ChatBoxSendFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isSending?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export default function ChatBoxSendForm({
  value,
  onChange,
  onSubmit,
  disabled,
  isSending,
  checked,
  onCheckedChange,
}: ChatBoxSendFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!disabled) {
      onSubmit();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    if (event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    if (!disabled && value.trim().length > 0) {
      onSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 p-3 border-t border-gray-200 dark:border-gray-800">
      <form className="flex items-center justify-between flex-col" onSubmit={handleSubmit}>
        <div className="relative w-full h-20">
          <textarea
            placeholder="Ask Evolvia..."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="custom-scrollbar w-full h-16 pl-2 pr-2 text-md text-gray-800 bg-transparent border-none outline-hidden placeholder:text-gray-400 focus:border-0 focus:ring-0 disabled:cursor-not-allowed dark:text-white/90 resize-none"
          />
        </div>

        <div className="flex flex-row flex-1 items-center w-full justify-between">
          {/* <button
            type="button"
            className="mr-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.9522 14.4422C12.9522 14.452 12.9524 14.4618 12.9527 14.4714V16.1442C12.9527 16.6699 12.5265 17.0961 12.0008 17.0961C11.475 17.0961 11.0488 16.6699 11.0488 16.1442V6.15388C11.0488 5.73966 10.7131 5.40388 10.2988 5.40388C9.88463 5.40388 9.54885 5.73966 9.54885 6.15388V16.1442C9.54885 17.4984 10.6466 18.5961 12.0008 18.5961C13.355 18.5961 14.4527 17.4983 14.4527 16.1442V6.15388C14.4527 6.14308 14.4525 6.13235 14.452 6.12166C14.4347 3.84237 12.5817 2 10.2983 2C8.00416 2 6.14441 3.85976 6.14441 6.15388V14.4422C6.14441 14.4492 6.1445 14.4561 6.14469 14.463V16.1442C6.14469 19.3783 8.76643 22 12.0005 22C15.2346 22 17.8563 19.3783 17.8563 16.1442V9.55775C17.8563 9.14354 17.5205 8.80775 17.1063 8.80775C16.6921 8.80775 16.3563 9.14354 16.3563 9.55775V16.1442C16.3563 18.5498 14.4062 20.5 12.0005 20.5C9.59485 20.5 7.64469 18.5498 7.64469 16.1442V9.55775C7.64469 9.55083 7.6446 9.54393 7.64441 9.53706L7.64441 6.15388C7.64441 4.68818 8.83259 3.5 10.2983 3.5C11.764 3.5 12.9522 4.68818 12.9522 6.15388L12.9522 14.4422Z"
                fill=""
              />
            </svg>
          </button> */}
          <button
            type="button"
            onClick={() => onCheckedChange?.(!checked)}
            className={`${checked ? "text-blue-500 bg-blue-100 hover:text-blue-400 hover:bg-blue-50" : "text-gray-500 hover:text-gray-800"} p-2 rounded-full flex items-center gap-1.5  dark:text-gray-400 dark:hover:text-white/90`}
          >
            <Globe size={22} />
            {checked && <span className=" text-md font-medium">Use global knowledge</span>}
          </button>
          <div className="flex items-center">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            >
              <svg
                className="stroke-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="7" y="2.75" width="10" height="12.5" rx="5" stroke="" strokeWidth="1.5" />
                <path
                  d="M20 10.25C20 14.6683 16.4183 18.25 12 18.25C7.58172 18.25 4 14.6683 4 10.25"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 21.25H14"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 18.25L12 21.25"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 7.5L12 10.5"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 8.25L14.5 9.75"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 8.25L9.5 9.75"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="submit"
              disabled={disabled || value.trim().length === 0}
              className="flex items-center justify-center ml-3 text-white rounded-lg h-9 w-9 bg-brand-500 hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-400 xl:ml-5"
            >
              {isSending ? (
                <span className="text-xs">...</span>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.98481 2.44399C3.11333 1.57147 1.15325 3.46979 1.96543 5.36824L3.82086 9.70527C3.90146 9.89367 3.90146 10.1069 3.82086 10.2953L1.96543 14.6323C1.15326 16.5307 3.11332 18.4291 4.98481 17.5565L16.8184 12.0395C18.5508 11.2319 18.5508 8.76865 16.8184 7.961L4.98481 2.44399ZM3.34453 4.77824C3.0738 4.14543 3.72716 3.51266 4.35099 3.80349L16.1846 9.32051C16.762 9.58973 16.762 10.4108 16.1846 10.68L4.35098 16.197C3.72716 16.4879 3.0738 15.8551 3.34453 15.2223L5.19996 10.8853C5.21944 10.8397 5.23735 10.7937 5.2537 10.7473L9.11784 10.7473C9.53206 10.7473 9.86784 10.4115 9.86784 9.99726C9.86784 9.58304 9.53206 9.24726 9.11784 9.24726L5.25157 9.24726C5.2358 9.20287 5.2186 9.15885 5.19996 9.11528L3.34453 4.77824Z"
                    fill="white"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
