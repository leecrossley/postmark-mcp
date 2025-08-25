import { join } from "path";
import { readdir, lstat, readFile } from "fs/promises";
import { existsSync } from "fs";

export async function listTemplateCategories(directoryPath) {
  try {
    if (!existsSync(directoryPath)) {
      console.error(`Error: Directory not found at path: ${directoryPath}`);
      return [];
    }

    const stat = await lstat(directoryPath);
    if (!stat.isDirectory()) {
      console.error(`Error: Path is not a directory: ${directoryPath}`);
      return [];
    }

    const entries = await readdir(directoryPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (error) {
    console.error("An error occurred while listing template categories:", error);
    return [];
  }
}

export async function listTemplatesInCategory(templatesBasePath, categoryName) {
  try {
    const categoryPath = join(templatesBasePath, categoryName);

    if (!existsSync(categoryPath)) {
      console.error(`Error: Category directory not found at path: ${categoryPath}`);
      return [];
    }

    const stat = await lstat(categoryPath);
    if (!stat.isDirectory()) {
      console.error(`Error: Category path is not a directory: ${categoryPath}`);
      return [];
    }

    const entries = await readdir(categoryPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (error) {
    console.error(
      `An error occurred while listing templates in category '${categoryName}':`,
      error
    );
    return [];
  }
}

export async function getTemplateContent(
  templatesBasePath,
  categoryName,
  templateName,
  format = "html"
) {
  try {
    const fileName = format === "text" ? "content.txt" : "content.html";
    const templatePath = join(
      templatesBasePath,
      categoryName,
      templateName,
      fileName
    );

    if (!existsSync(templatePath)) {
      console.error(
        `Error: Template ${format} content not found at path: ${templatePath}`
      );
      return null;
    }

    const content = await readFile(templatePath, "utf8");
    return content;
  } catch (error) {
    console.error(
      `An error occurred while reading template content for '${templateName}' in category '${categoryName}':`,
      error
    );
    return null;
  }
}

export async function getTemplateIdeas(templatesBasePath, topic) {
  try {
    const topicLower = topic.toLowerCase();
    const ideas = [];

    const categories = await listTemplateCategories(templatesBasePath);
    if (categories.length === 0) {
      console.error("No template categories found");
      return [];
    }

    for (const category of categories) {
      const templates = await listTemplatesInCategory(templatesBasePath, category);
      if (templates.length === 0) continue;
      for (const template of templates) {
        if (template.toLowerCase().includes(topicLower)) {
          ideas.push({ category, template });
        }
      }
    }

    return ideas;
  } catch (error) {
    console.error(
      `An error occurred while searching for template ideas with topic '${topic}':`,
      error
    );
    return [];
  }
}


