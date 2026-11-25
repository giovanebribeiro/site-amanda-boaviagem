import { getStaticPaths, getStaticProps } from "@/pages/blog/[slug]";
import type { SiteData } from "@/types";

jest.mock("next-mdx-remote/serialize", () => ({
  serialize: jest.fn().mockResolvedValue({ compiledSource: "" }),
}));

describe("PostPage getStaticProps", () => {
  it("provides the site texts for the header and footer", async () => {
    const paths = await getStaticPaths({});
    const first = (paths as unknown as { paths: { params: { slug?: string } }[] })
      .paths[0];
    const slug = first?.params.slug as string;
    expect(slug).toBeDefined();

    const result = await getStaticProps({ params: { slug } });
    const { props } = result as { props: { site: SiteData } };
    expect(props.site.slogan).toBe("Escritora da Esperança");
  });
});
