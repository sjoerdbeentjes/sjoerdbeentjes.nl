import fs from "node:fs/promises";
import { Window } from "happy-dom";

const profileUrl = "https://medium.com/@sjoerd3000";
const dataDir = "src/data";

const formatArticleUrl = (path: string) => {
  return `https://medium.com${path?.split("?")[0]}`;
};

const downloadImage = async (imgUrl: string) => {
  try {
    const imageName = imgUrl.split("/").pop()?.split("?")[0] || "";
    const originalImageUrl = imgUrl.replace("resize:fill:224:224/", "");

    const response = await fetch(originalImageUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();

    const imagesDir = `${dataDir}/images`;
    await fs.mkdir(imagesDir, { recursive: true });

    const imagePath = `${imagesDir}/${imageName}`;
    await fs.writeFile(imagePath, Buffer.from(imageBuffer));

    return imageName;
  } catch (error) {
    console.error(`Error handling image ${imgUrl}:`, error);
    throw error;
  }
};

const profileHtml = await fetch(profileUrl).then((res) => res.text());

const window = new Window();
const document = window.document;

document.body.innerHTML = profileHtml;

const articleElements = document.querySelectorAll("article");

const articles = await Promise.all(
  articleElements.map(async (element) => {
    const title = element.querySelector("h2")?.textContent;
    const excerpt = element.querySelectorAll("p")[1]?.textContent;
    const path = element.querySelector("a")?.getAttribute("href");
    const url = path ? formatArticleUrl(path) : null;
    const imageUrl = element.querySelector("img")?.getAttribute("src");
    const imageName = imageUrl ? await downloadImage(imageUrl) : null;

    return {
      title,
      excerpt,
      path,
      url,
      imageUrl,
      imageName,
    };
  })
);

fs.writeFile(`${dataDir}/articles.json`, JSON.stringify(articles, null, 2))
  .then(() => console.log("Articles saved!"))
  .catch((error) => console.error("Error saving articles:", error));
