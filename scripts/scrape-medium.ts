import fs from 'node:fs/promises'
import { load } from 'cheerio';

const fetchHtml = async (url: string) => {
  const response = await fetch(url);
  const html = await response.text();

  return html;
}

const handleImage = async (imgUrl: string) => {
  // write image to disk and remove all formatting params
  const splitUrl = imgUrl.split('/');
  const imageName = splitUrl[splitUrl.length - 1].split('?')[0];
  const originalImageUrl = imgUrl.replace('resize:fill:224:224/', '')

  // download image
  const imageResponse = await fetch(originalImageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  await fs.mkdir('src/data/images', { recursive: true });

  // write image to disk
  await fs.writeFile(`src/data/images/${imageName}`, Buffer.from(imageBuffer));

  return imageName
}

const scrapeArticles = async () => {
  const url = 'https://medium.com/@sjoerd3000';
  const html = await fetchHtml(url);

  const $ = load(html);

  const headings = $('article');

  const articles = await Promise.all(headings.map(async (_, element) => {
    const title = $(element).find('h2').text();
    const excerpt = $($($(element).find('p').toArray()[1]).toString()).text();
    const path = $(element).find('a').attr('href');
    const url = `https://medium.com${path?.split('?')[0]}`;
    const imgUrl = $(element).find('img').attr('src')

    const imageName = await handleImage(imgUrl || '');

    return {
      url,
      title,
      excerpt,
      imageName
    }
  }));

  await fs.mkdir('src/data', { recursive: true });

  await fs.writeFile('src/data/articles.json', JSON.stringify(articles, null, 2));
}

scrapeArticles();
