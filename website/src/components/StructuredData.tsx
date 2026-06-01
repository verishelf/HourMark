type JsonLd = Record<string, unknown>;

type Props = {
  data: JsonLd | JsonLd[];
};

export function StructuredData({ data }: Props) {
  const graphs = Array.isArray(data) ? data : [data];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
      ))}
    </>
  );
}
