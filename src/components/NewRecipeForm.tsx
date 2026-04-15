import React, { useState } from "react";
import { Form, Button, Col, Row, Spinner, Image } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl } from "../constants";
import { Recipe, User, NewRecipe } from "../types";
import DynamicInput from "./DynamicInput";
import { useNavigate } from "react-router-dom";

interface Item {
  value: string;
  id: string;
}

interface Props {
  handleClose: () => void;
  loggedInUser: User | null | undefined;
  recipe?: Recipe;
  setRecipe?: React.Dispatch<React.SetStateAction<Recipe | null>>;
}

const NewRecipeForm: React.FC<Props> = ({
  handleClose,
  loggedInUser,
  recipe,
  setRecipe,
}: Props) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [link, setLink] = useState(recipe?.link ?? "");
  const [totalTime, setTotalTime] = useState(recipe?.totalTime ?? 0);
  const [cookTime, setCookTime] = useState(recipe?.cookTime ?? 0);
  const [prepTime, setPrepTime] = useState(recipe?.prepTime ?? 0);
  const [author, setAuthor] = useState(recipe?.author ?? "");

  const newItem = (value: string): Item => ({ value, id: crypto.randomUUID() });

  const [ingredients, setIngredients] = useState<Item[]>(
    recipe ? recipe.ingredients.map((i) => newItem(i)) : [],
  );
  const [directions, setDirections] = useState<Item[]>(
    recipe ? recipe.directions.map((i) => newItem(i)) : [],
  );
  const [notes, setNotes] = useState<Item[]>(
    recipe?.notes ? recipe.notes.map((i) => newItem(i)) : [],
  );
  const [tags, setTags] = useState<Item[]>(recipe?.tags ? recipe.tags.map((i) => newItem(i)) : []);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [image, setImage] = useState(recipe?.imageURL);

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
    if (e.target.value !== "") {
      setIsSupported(true);
      try {
        new URL(e.target.value);
      } catch {
        setIsSupported(false);
      }
    }
  };

  const applyParsedRecipe = (data: Record<string, unknown>) => {
    setIngredients(
      Array.isArray(data.recipeIngredient)
        ? data.recipeIngredient.map((i: string) => newItem(i))
        : [],
    );
    setDirections(
      Array.isArray(data.recipeInstructions)
        ? data.recipeInstructions.map((i: string | Record<string, string>) =>
            newItem(typeof i === "string" ? i : i.text || ""),
          )
        : [],
    );
    setTitle((data.name as string) ?? "");
    setTags(
      Array.isArray(data.keywords)
        ? data.keywords.map((t: string) => newItem(t))
        : typeof data.keywords === "string"
          ? data.keywords.split(",").map((t: string) => newItem(t.trim()))
          : [],
    );
    const img = data.image;
    setImage(typeof img === "string" ? img : Array.isArray(img) ? img[img.length - 1] : "");
    setCookTime((data.cookTime as number) ?? 0);
    setTotalTime((data.totalTime as number) ?? 0);
    setPrepTime((data.prepTime as number) ?? 0);
    const author = data.author;
    setAuthor(
      typeof author === "string" ? author : ((author as Record<string, string>)?.name ?? ""),
    );
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportError("");

    try {
      const result = await axios.get(`${apiBaseUrl}/parse?url=${link}`);
      if (result.status === 200 && result.data && !result.data.error) {
        applyParsedRecipe(result.data);
      } else {
        setImportError("No recipe found on this page");
      }
    } catch {
      setImportError("Could not import recipe from this URL");
    }

    setIsImporting(false);
  };

  const handlePasteJson = () => {
    setImportError("");
    navigator.clipboard
      .readText()
      .then((text) => {
        try {
          const data = JSON.parse(text);
          if (data["@type"] === "Recipe" || data.recipeIngredient) {
            applyParsedRecipe(data);
          } else {
            setImportError("Clipboard doesn't contain recipe JSON");
          }
        } catch {
          setImportError("Clipboard doesn't contain valid JSON");
        }
      })
      .catch(() => {
        setImportError("Could not read clipboard — check browser permissions");
      });
  };

  const consoleSnippet = `document.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{try{const d=JSON.parse(s.textContent);const find=o=>o?.['@type']==='Recipe'?o:o?.['@graph']?.find(i=>i['@type']==='Recipe');const r=find(d);if(r){copy(JSON.stringify(r));console.log('Copied!',r.name)}}catch{}})`;

  const handleSubmit = async (event: React.FormEvent<EventTarget>) => {
    const newRec: NewRecipe = {
      ingredients: ingredients.flatMap((i) => (i.value === "" ? [] : i.value)),
      title,
      description,
      directions: directions.flatMap((d) => (d.value === "" ? [] : d.value)),
      tags: tags.flatMap((t) => (t.value === "" ? [] : t.value)),
      notes: notes.flatMap((n) => (n.value === "" ? [] : n.value)),
      link,
      userId: loggedInUser?.id,
      imageURL: image === "" ? undefined : image,
      author,
      prepTime,
      cookTime,
      totalTime,
    };
    event.preventDefault();
    event.stopPropagation();
    if (recipe) {
      const response = await axios.put(
        `${apiBaseUrl}/recipes/${recipe.id}`,
        { recipe: newRec },
        {
          headers: { Authorization: "Bearer " + loggedInUser?.token },
        },
      );
      if (response.data && setRecipe) {
        setRecipe(response.data);
      }
    } else {
      const response = await axios.post(`${apiBaseUrl}/recipes`, newRec, {
        headers: { Authorization: "Bearer " + loggedInUser?.token },
      });
      if (response.status === 201 && response.data) {
        navigate(`/recipes/${response.data.id}`);
      }
    }
    handleClose();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Title *</Form.Label>
        <Form.Control
          type="text"
          required
          placeholder="Recipe title"
          value={title}
          onChange={({ target }) => setTitle(target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Author</Form.Label>
        <Form.Control
          type="text"
          value={author}
          onChange={({ target }) => setAuthor(target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Link</Form.Label>
        <Row>
          <Col>
            <Form.Control
              type="text"
              placeholder="www.example.com"
              value={link}
              onChange={handleLinkChange}
            />
          </Col>
          <Col xs={3}>
            <Button disabled={link === "" || !isSupported} onClick={handleImport}>
              {isImporting ? <Spinner animation="border" size="sm" /> : "Import"}
            </Button>
          </Col>
        </Row>
        {importError && (
          <div className="error" style={{ marginTop: "10px" }}>
            {importError}
          </div>
        )}
        <details style={{ marginTop: "10px", fontSize: "13px", color: "#666" }}>
          <summary style={{ cursor: "pointer" }}>Import not working?</summary>
          <div style={{ marginTop: "8px" }}>
            <p>Some sites block automatic imports. You can manually copy the recipe data:</p>
            <ol>
              <li>Open the recipe page in a new tab</li>
              <li>Open the browser console (F12 or Cmd+Option+J)</li>
              <li>Paste this and press Enter:</li>
            </ol>
            <pre
              style={{
                background: "var(--bs-tertiary-bg)",
                padding: "8px",
                fontSize: "11px",
                overflowX: "auto",
                borderRadius: "4px",
              }}
            >
              {consoleSnippet}
            </pre>
            <p>Then click the button below:</p>
            <Button size="sm" variant="outline-secondary" onClick={handlePasteJson}>
              Paste recipe from clipboard
            </Button>
          </div>
        </details>
      </Form.Group>
      <Form.Group>
        <Form.Label>Image URL</Form.Label>
        {image ? <Image src={image} height="100px" style={{ margin: "5px" }} /> : null}
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={description}
          placeholder="Short description..."
          onChange={({ target }) => setDescription(target.value)}
        />
      </Form.Group>
      <DynamicInput
        title="Ingredients *"
        required
        startNum={3}
        itemList={ingredients}
        setItemList={setIngredients}
      />
      <DynamicInput
        title="Directions *"
        large
        required
        startNum={3}
        itemList={directions}
        setItemList={setDirections}
      />
      <DynamicInput title="Tags *" required itemList={tags} setItemList={setTags} />
      <DynamicInput title="Notes" itemList={notes} setItemList={setNotes} />
      <Form.Group>
        <Form.Label>Total Time (minutes)</Form.Label>
        <Form.Control
          type="number"
          value={totalTime}
          onChange={({ target }) => setTotalTime(+target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Prep Time (minutes)</Form.Label>
        <Form.Control
          type="number"
          value={prepTime}
          onChange={({ target }) => setPrepTime(+target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Cook Time (minutes)</Form.Label>
        <Form.Control
          type="number"
          value={cookTime}
          onChange={({ target }) => setCookTime(+target.value)}
        />
      </Form.Group>
      <div className="container" style={{ marginTop: "20px", marginBottom: "20px" }}>
        <Button type="submit" size="lg" className="w-100">
          {recipe ? "Update" : "Submit"}
        </Button>
      </div>
    </Form>
  );
};

export default NewRecipeForm;
