import { PrismaClient } from "../client";
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      email: `admin@admin.com`,
      name: "Admin",
      password: "supersecret",
      roles: ["Admin"],
    },
  });

  const firstPost = await prisma.article.upsert({
    where: {
      id: "first-post",
    },
    update: {},
    create: {
      documentUrl: "s3://somebucket/someobject",
      source: "User",
      summary:
        "In this paper we present Morphy, an integrated tool for German morphology, part-of-speech tagging and context-sensitive lemmatization. Its large lexicon of more than 320,000 word forms plus its ability to process German compound nouns guarantee a wide morphological coverage. Syntactic ambiguities can be resolved with a standard statistical part-of-speech tagger. By using the output of the tagger, the lemmatizer can determine the correct root even for ambiguous word forms. The complete package is freely available and can be downloaded from the World Wide Web.",
      title: "My First Post",
      authors: {
        connect: {
          id: admin.id,
        },
      },
      categories: ["cs.LG"],
    },
  });
  const firstArxivPost = await prisma.article.upsert({
    where: {
      id: "first-arxiv-post",
    },
    update: {},
    create: {
      documentUrl: "https://arxiv.org/pdf/1806.07687.pdf",
      source: "Arxiv",
      summary:
        "The recently increased focus on misinformation has stimulated research in fact checking, the task of assessing the truthfulness of a claim. Research in automating this task has been conducted in a variety of disciplines including natural language processing, machine learning, knowledge representation, databases, and journalism. While there has been substantial progress, relevant papers and articles have been published in research communities that are often unaware of each other and use inconsistent terminology, thus impeding understanding and further progress. In this paper we survey automated fact checking research stemming from natural language processing and related disciplines, unifying the task formulations and methodologies across papers and authors. Furthermore, we highlight the use of evidence as an important distinguishing factor among them cutting across task formulations and methods. We conclude with proposing avenues for future NLP research on automated fact checking.",
      title:
        "Automated Fact Checking: Task formulations, methods and future directions",
      categories: ["cs.CL"],
      arxivArticle: {
        connectOrCreate: {
          where: { id: "https://arxiv.org/abs/1806.07687" },
          create: {
            title:
              "Automated Fact Checking: Task formulations, methods and future directions",
            summary:
              "The recently increased focus on misinformation has stimulated research in fact checking, the task of assessing the truthfulness of a claim. Research in automating this task has been conducted in a variety of disciplines including natural language processing, machine learning, knowledge representation, databases, and journalism. While there has been substantial progress, relevant papers and articles have been published in research communities that are often unaware of each other and use inconsistent terminology, thus impeding understanding and further progress. In this paper we survey automated fact checking research stemming from natural language processing and related disciplines, unifying the task formulations and methodologies across papers and authors. Furthermore, we highlight the use of evidence as an important distinguishing factor among them cutting across task formulations and methods. We conclude with proposing avenues for future NLP research on automated fact checking.",
            published: new Date("Wed, 20 Jun 2018 12:13:53 UTC"),
            updated: new Date("Wed, 5 Sep 2018 12:47:39 UTC"),
            authors: ["James Thorne", "Andreas Vlachos"],
            categories: ["cs.CL"],
            id: "https://arxiv.org/abs/1806.07687",
          },
        },
      },
    },
  });
}

export async function seed() {
  return main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
