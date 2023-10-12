import { useCompletion } from "ai/react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export function SearchBar() {
  const [query, setQuery] = useState<string>("");

  const { complete, completion, isLoading, error } = useCompletion({
    api: "/api/vector-search",
  });

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    complete(query);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="relative flex flex-row space-x-3 mb-3">
          <input
            placeholder="Learn more about Beam by asking a question..."
            name="search"
            value={query}
            disabled={isLoading}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-50 dark:focus:ring-slate-400 disabled:pointer-events-none dark:focus:ring-offset-slate-900 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800 bg-slate-900 text-white hover:bg-slate-500 dark:bg-slate-700 dark:text-slate-200 h-10 py-2 px-4"
          >
            Ask
          </button>
        </div>
      </form>

      <div className="bg-slate-700 py-3 px-4 rounded-md min-h-[48px]">
        {isLoading && (
          <div className="flex items-center gap-3">🤔 thinking...</div>
        )}
        {error && (
          <div className="flex items-center gap-3">
            <span>❌</span>
            <span className="text-slate-700 dark:text-slate-100">
              The search has failed! Please try again.
            </span>
          </div>
        )}
        {completion && !isLoading && !error ? (
          <div className="">
            <ReactMarkdown
              components={{
                code(props) {
                  return (
                    <code className="text-gray-400">{props.children}</code>
                  );
                },
              }}
            >
              {completion}
            </ReactMarkdown>
          </div>
        ) : null}{" "}
      </div>
    </div>
  );
}
