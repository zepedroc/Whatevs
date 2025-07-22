import Image from 'next/image';

interface FilePreviewProps {
  files: FileList | File[] | null;
}

export default function FilePreview({ files }: FilePreviewProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-row gap-2 absolute bottom-12 px-4 w-full md:w-[500px] md:px-0">
      {Array.from(files).map((file) =>
        file.type.startsWith('image') ? (
          <div key={file.name}>
            <Image src={URL.createObjectURL(file)} alt={file.name} className="rounded-md w-16" width={64} height={64} />
          </div>
        ) : (
          <div key={file.name}>
            <p>{file.name}</p>
          </div>
        ),
      )}
    </div>
  );
}
