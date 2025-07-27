import Image from 'next/image';

interface FilePreviewProps {
  files: File[];
  onRemove?: (index: number) => void;
  onImageClick?: (file: File) => void;
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreview({ files, onRemove, onImageClick }: FilePreviewProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-row flex-wrap gap-2 mb-2">
      {files.map((file, idx) => (
        <div
          key={file.name + idx}
          className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm max-w-xs"
        >
          <div className="flex items-center">
            {file.type.startsWith('image') ? (
              <button
                type="button"
                className="mr-2 focus:outline-none"
                onClick={() => onImageClick && onImageClick(file)}
                tabIndex={-1}
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="rounded w-8 h-8 object-cover border border-gray-200"
                  width={32}
                  height={32}
                />
              </button>
            ) : (
              <div className="mr-2 w-8 h-8 flex items-center justify-center bg-gray-200 rounded text-xs text-gray-500">
                {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{file.name}</span>
              <span className="text-[10px] text-gray-400">{formatSize(file.size)}</span>
            </div>
          </div>
          {onRemove && (
            <div className="flex items-center ml-4">
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={() => onRemove(idx)}
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
