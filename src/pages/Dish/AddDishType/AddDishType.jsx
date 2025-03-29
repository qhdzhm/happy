import HeadLabel from "@/components/HeadLable/HeadLabel";
import { Button, Form, Input, Select, Tag, Upload, message } from "antd";
import React, { useEffect, useState } from "react";
import useCategoryList from "../hooks/useCategoryList";
import TextArea from "antd/es/input/TextArea";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "@/utils";
import { addDish, getDishById, updateDish } from "@/apis/Dish";
import "./AddDishType.scss";

const AddDishType = () => {
  const token = getToken();
  const [form] = Form.useForm();
  //original dish Flavour
  const [dishFlavourData] = useState([
    {
      name: "Sweetness",
      value: [
        "No Sugar",
        "Less Sugar",
        "Half Sugar",
        "More Sugar",
        "Full Sugar",
      ],
    },
    {
      name: "Temperature",
      value: ["Hot", "Normal", "Less Ice", "Light Ice", "Extra Ice"],
    },
    {
      name: "Avoidances",
      value: ["No Onions", "No Garlic", "No Cilantro", "No Spicy"],
    },
    { name: "Spiciness", value: ["Non-Spicy", "Mild", "Medium", "Spicy"] },
  ]);
  //dishFlavour for submit
  const [dishFlavour, setDishFlavour] = useState([]);

  //leftDishFlavors
  const [leftDishFlavors, setLeftDishFlavors] = useState([]);
  //handle left flavour
  useEffect(() => {
    function fetLeftDishFlavors() {
      let arr = [];
      dishFlavourData.forEach((item) => {
        if (dishFlavour.findIndex((item1) => item.name === item1.name) === -1) {
          arr.push(item);
        }
        setLeftDishFlavors(arr);
      });
    }
    fetLeftDishFlavors();
  }, [dishFlavour, dishFlavourData]);

  const [params] = useSearchParams();
  const id = params.get("id");
  let flavors = [];
  useEffect(() => {
    async function getDish() {
      const res = await getDishById(id);
      form.setFieldsValue(res.data.data);
      setFile([{ url: res.data.data.image }]);
      const arr = res.data.data.flavors.map((flavor) => {
        return { ...flavor, value: JSON.parse(flavor.value) };
      });
      setDishFlavour(arr);
    }
    if (id) {
      setTitle("Update Dish");
      getDish();
    } else {
      setTitle("Add Dish");
    }
  }, [id, form]);
  //handle dishFlavour
  const selectHandle = (index, value) => {
    const arr = [...dishFlavour];
    const ind = dishFlavourData.findIndex((item) => item.name === value);
    arr[index] = JSON.parse(JSON.stringify(dishFlavourData[ind]));
    setDishFlavour(arr);
  };

  const delFlavorLabel = (index, ind) => {
    const updatedDishFlavour = dishFlavour.map((item, idx) =>
      idx === index
        ? { ...item, value: item.value.filter((_, i) => i !== ind) }
        : item
    );
    setDishFlavour(updatedDishFlavour);
  };

  //add flavour
  const addFlavour = () => {
    setDishFlavour([
      ...dishFlavour,
      {
        name: "",
        value: [],
      },
    ]);
  };
  //delete flavour
  const delFlavour = (name) => {
    const updatedDishFlavour = dishFlavour.filter((item) => item.name !== name);
    setDishFlavour(updatedDishFlavour);
  };

  
  const [title, setTitle] = useState("Add Dish");

  const dishCategorys = useCategoryList();
  //file upload
  const [file, setFile] = useState([]);

  const onUploadChange = (info) => {
    setFile(info.fileList);
  };

  const onFinish = async (values) => {
    const { name, price, categoryId, description } = values;
    const flavors = dishFlavour.map((obj) => ({
      ...obj,
      value: JSON.stringify(obj.value),
    }));

    let params = {
      name,
      price,
      flavors: flavors,
      categoryId,
      description,
      image: file[0]?.response?.data || file[0]?.url || null,
      status: 1,
    };
    if (!id) {
      try {
        const res = await addDish(params);
        if (res.data.code === 1) {
          message.success("submit success");
          navigate("/dish");
          console.log(file);
        } else {
          message.error(res.data.msg);
          form.resetFields();
        }
      } catch (error) {
        message.error(error);
      }
    } else {
      params = {
        ...params,
        id: id,
      };

      try {
        const res = await updateDish(params);
        if (res.data.code === 1) {
          message.success("submit success");
          navigate("/dish");
          console.log(file);
        } else {
          message.error(res.data.msg);
          form.resetFields();
        }
      } catch (error) {
        message.error(error);
      }
    }
  };
  const navigate = useNavigate();
  const handleCancel = () => {
    navigate(-1);
  };
  return (
    <div className="add-dish">
      <HeadLabel title={title} goback={true}></HeadLabel>
      <div className="form-container">
        <Form
          validateTrigger={["onBlur"]}
          id="form"
          form={form}
          labelCol={{
            span: 4,
          }}
          wrapperCol={{
            span: 14,
          }}
          layout="horizontal"
          onFinish={onFinish}
          initialValues={{ flavors: flavors }}
        >
          <Form.Item
            label="Dish Name"
            name="name"
            rules={[{ required: true, message: "Please input your username" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[
              { required: true, message: "Please input Price" },
              {
                pattern: /^\d+$/,
                message: "Please input numbers",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Flavors" name="flavors">
            {dishFlavour.length === 0 ? (
              <Button type="primary" onClick={addFlavour}>
                + Add Flavour
              </Button>
            ) : (
              <div className="flavour">
                <div className="cont">
                  <div className="title">
                    <span>Flavour Name</span>
                  </div>
                  {dishFlavour.map((item, index) => (
                    <div key={index} className="items flex">
                      <div className="flavor-select">
                        <Select
                          value={item.name}
                          onChange={(value) => selectHandle(index, value)}
                        >
                          {leftDishFlavors.map((flavour, index) => (
                            <Select.Option key={index} value={flavour.name}>
                              {flavour.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </div>

                      <div className="label-Items">
                        <div className="tag-container">
                          {item.value.map((item, ind) => (
                            <Tag
                              key={item}
                              closable
                              onClose={() => delFlavorLabel(index, ind)}
                            >
                              {item}
                            </Tag>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="primary"
                        onClick={() => delFlavour(item.name)}
                      >
                        delete
                      </Button>
                    </div>
                  ))}
                  {leftDishFlavors.length > 0 &&
                    dishFlavour.length < dishFlavourData.length && (
                      <Button
                        type="primary"
                        className="addBut"
                        onClick={addFlavour}
                      >
                        + Add Flavour
                      </Button>
                    )}
                </div>
              </div>
            )}
          </Form.Item>

          <Form.Item label="Category" name="categoryId">
            <Select options={dishCategorys} />
          </Form.Item>

          <Form.Item
            label="image"
            name="image"
            required
            rules={[{ required: true, message: "Please upload cover" }]}
          >
            <Upload
              name="file"
              listType="picture-card"
              showUploadList={false}
              action={"http://localhost:8080/admin/images/upload"}
              onChange={onUploadChange}
              maxCount={1}
              headers={{
                Token: `${token}`,
              }}
              fileList={file}
            >
              <div style={{ marginTop: 8 }}>
                <PlusOutlined />
              </div>
            </Upload>
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={4} />
          </Form.Item>

          <div className="add-dish-footer">
            <Button type="default" onClick={handleCancel}>
              Cancel
            </Button>
            <Button form="form" key="submit" htmlType="submit" type="primary">
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddDishType;
