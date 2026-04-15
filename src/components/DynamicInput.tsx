import React from "react";
import { Button, Form, Container, Row, Col } from "react-bootstrap";

interface Item {
  value: string;
  id: string;
}

interface Props {
  title: string;
  startNum?: number;
  itemList: Item[];
  setItemList: React.Dispatch<React.SetStateAction<Item[]>>;
  required?: boolean;
  type?: string;
  large?: boolean;
}

const DynamicInput: React.FC<Props> = ({
  title,
  startNum = 1,
  itemList,
  setItemList,
  required = false,
  type = "text",
  large = false,
}: Props) => {
  const newItem = (): Item => ({ value: "", id: crypto.randomUUID() });

  const updateItem = (id: string, value: string) => {
    const index = itemList?.findIndex((i) => i.id === id);
    let items = [...itemList];
    const item = { ...itemList[index] };
    if (!item) {
      return;
    }
    item.value = value;
    items[index] = item;
    if (index === itemList?.length - 1) {
      items = [...items, newItem()];
    }
    setItemList(items);
  };

  React.useEffect(() => {
    if (itemList === undefined || itemList?.length === 0) {
      setItemList([...Array(startNum)].map(() => newItem()));
    }
  }, [startNum, setItemList, itemList]);

  const removeItem = (id: string) => {
    setItemList(itemList ? itemList.filter((i) => i.id !== id) : []);
  };

  const addItem = () => {
    setItemList([...itemList, newItem()]);
  };

  const isDisabled: boolean = itemList?.length === 1 && required === true;

  return (
    <div>
      <Form.Label>{title}</Form.Label>
      <Container style={{ marginBottom: "20px" }}>
        {itemList.map((i, index) => (
          <Row key={i.id}>
            <Col>
              <Form.Group>
                {large ? (
                  <Form.Control
                    as="textarea"
                    rows={2}
                    required={required && index === 0}
                    value={i.value}
                    onChange={({ target }) => updateItem(i.id, target.value)}
                  />
                ) : (
                  <Form.Control
                    type={type}
                    required={required && index === 0}
                    value={i.value}
                    onChange={({ target }) => updateItem(i.id, target.value)}
                  />
                )}
              </Form.Group>
            </Col>
            <Col xs={2}>
              <Button
                disabled={isDisabled}
                variant="outline-secondary"
                onClick={() => removeItem(i.id)}
              >
                -
              </Button>
            </Col>
          </Row>
        ))}
        <Row>
          <Col>
            <Button variant="light" onClick={addItem}>
              +
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DynamicInput;
