import fs from 'node:fs/promises'
import { load } from 'cheerio';

const fetchHtml = async (url: string) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    return html;
  } catch (error) {
    console.log(error);
  }
}

const scrapeArticles = async () => {
  const url = 'https://medium.com/@sjoerd3000';
  const html = await fetchHtml(url);

  const $ = load(html);

  const headings = $('article');

  const articles = headings.map((_, element) => {
    const title = $(element).find('h2').text();
    const excerpt = $($($(element).find('p').toArray()[1]).toString()).text();
    const path = $(element).find('a').attr('href');
    const url = `https://medium.com${path?.split('?')[0]}`;
    const imgUrl = $(element).find('img').attr('src');

    return {
      url,
      title,
      excerpt,
      imgUrl
    }
  });

  await fs.mkdir('src/data', { recursive: true });

  await fs.writeFile('src/data/articles.json', JSON.stringify(articles.get(), null, 2));
}

scrapeArticles();
