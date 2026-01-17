type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

const buildDangerNodes = (value: string) => {
  const regex = /%%([^%]+)%%/g;
  const nodes: MdastNode[] = [];
  let lastIndex = 0;
  let match = regex.exec(value);

  while (match) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    if (matchStart > lastIndex) {
      nodes.push({ type: "text", value: value.slice(lastIndex, matchStart) });
    }
    nodes.push({
      type: "strong",
      children: [{ type: "text", value: match[1] }],
      data: {
        hName: "span",
        hProperties: { className: "md-danger" },
      },
    });
    lastIndex = matchEnd;
    match = regex.exec(value);
  }

  if (nodes.length === 0) {
    return null;
  }

  if (lastIndex < value.length) {
    nodes.push({ type: "text", value: value.slice(lastIndex) });
  }

  return nodes;
};

export const remarkDanger = () => {
  return (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      if (!node.children) return;
      let index = 0;
      while (index < node.children.length) {
        const child = node.children[index];
        if (child.type === "text" && typeof child.value === "string") {
          const replaced = buildDangerNodes(child.value);
          if (replaced) {
            node.children.splice(index, 1, ...replaced);
            index += replaced.length;
            continue;
          }
        }
        visit(child);
        index += 1;
      }
    };

    visit(tree);
  };
};
