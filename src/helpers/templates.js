import { join } from "path";
import { readdir, lstat, readFile, access } from "fs/promises";
import { constants as fsConstants } from "fs";

export async function listTemplateCategories(directoryPath) {
  try {
    try {
      await access(directoryPath, fsConstants.F_OK | fsConstants.R_OK);
    } catch (_) {
      return { ok: false, code: "NOT_FOUND", message: `Directory not found at path: ${directoryPath}` };
    }

    const stat = await lstat(directoryPath);
    if (!stat.isDirectory()) {
      return { ok: false, code: "NOT_DIR", message: `Path is not a directory: ${directoryPath}` };
    }

    const entries = await readdir(directoryPath, { withFileTypes: true });
    return { ok: true, categories: entries.filter((e) => e.isDirectory()).map((e) => e.name) };
  } catch (error) {
    return { ok: false, code: "IO_ERROR", message: String(error?.message || error) };
  }
}

export async function listTemplatesInCategory(templatesBasePath, categoryName) {
  try {
    const categoryPath = join(templatesBasePath, categoryName);

    try {
      await access(categoryPath, fsConstants.F_OK | fsConstants.R_OK);
    } catch (_) {
      return { ok: false, code: "NOT_FOUND", message: `Category directory not found at path: ${categoryPath}` };
    }

    const stat = await lstat(categoryPath);
    if (!stat.isDirectory()) {
      return { ok: false, code: "NOT_DIR", message: `Category path is not a directory: ${categoryPath}` };
    }

    const entries = await readdir(categoryPath, { withFileTypes: true });
    return { ok: true, templates: entries.filter((e) => e.isDirectory()).map((e) => e.name) };
  } catch (error) {
    return { ok: false, code: "IO_ERROR", message: String(error?.message || error) };
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

    try {
      await access(templatePath, fsConstants.F_OK | fsConstants.R_OK);
    } catch (_) {
      return { ok: false, code: "NOT_FOUND", message: `Template ${format} content not found at path: ${templatePath}` };
    }

    const content = await readFile(templatePath, "utf8");
    return { ok: true, content };
  } catch (error) {
    return { ok: false, code: "IO_ERROR", message: String(error?.message || error) };
  }
}

export async function getTemplateIdeas(templatesBasePath, topic) {
  try {
    const topicLower = topic.toLowerCase();
    const ideas = [];

    const categoriesRes = await listTemplateCategories(templatesBasePath);
    if (!categoriesRes.ok) {
      return { ok: false, code: categoriesRes.code, message: categoriesRes.message };
    }
    const categories = categoriesRes.categories;
    if (categories.length === 0) {
      return { ok: true, ideas: [] };
    }

    for (const category of categories) {
      const templatesRes = await listTemplatesInCategory(templatesBasePath, category);
      if (!templatesRes.ok) continue;
      const templates = templatesRes.templates;
      if (templates.length === 0) continue;
      for (const template of templates) {
        if (template.toLowerCase().includes(topicLower)) {
          ideas.push({ category, template });
        }
      }
    }

    return { ok: true, ideas };
  } catch (error) {
    return { ok: false, code: "IO_ERROR", message: String(error?.message || error) };
  }
}


