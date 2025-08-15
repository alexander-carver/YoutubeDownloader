type JsonLdProps = {
  data: Record<string, unknown>;
  id?: string;
};

export default function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


