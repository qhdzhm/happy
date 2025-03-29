import HeadLabel from "@/components/HeadLable/HeadLabel";
import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Table,
  Tag,
  Upload,
} from "antd";
import React, { useEffect, useState } from "react";
import TextArea from "antd/es/input/TextArea";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getToken } from "@/utils";
import { getDishListByCateId } from "@/apis/Dish";
import "./AddSetmeal.scss";
import useMealCategory from "../hooks/useMealCategory";
import useCategoryList from "@/pages/Dish/hooks/useCategoryList";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addMeal, getMealById, updateMeal } from "@/apis/Setmeal";
const AddDishType = () => {
  const token = getToken();
  const [form] = Form.useForm();
  const mealCategory = useMealCategory();
  const dishCategory = useCategoryList();
  const [open, setOpen] = useState(false);
  const [bodyTrigger, setBodyTrigger] = useState(false);

  const handleCounter = (id, copies, operation) => {
    const updatedDishes = Object.keys(selectedDishMap).reduce((acc, key) => {
      acc[key] = selectedDishMap[key].map((dish) => {
        if (dish.id === id) {
          if (operation === "add") {
            return { ...dish, copies: copies + 1 };
          } else if (operation === "subtract") {
            return { ...dish, copies: copies - 1 };
          }
        }
        return dish;
      });
      return acc;
    }, {});

    setSelectedDishMap(updatedDishes);
  };
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, status) => (
        <>
          {status === 0 ? (
            <div className="ban">
              <Tag color="red">banned</Tag>
            </div>
          ) : (
            <div className="active">
              <Tag color="green">active</Tag>
            </div>
          )}
        </>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
    },
  ];

  const dishColums = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Price",
      dataIndex: "price",
    },
    {
      title: "Couter",
      render: (_, { id, copies }) => (
        <div className="counter">
          <Button
            disabled={copies <= 1}
            onClick={() => {
              handleCounter(id, copies, "subtract");
            }}
            size="small"
          >
            -
          </Button>
          <span>{copies}</span>
          <Button
            size="small"
            onClick={() => {
              handleCounter(id, copies, "add");
            }}
          >
            +
          </Button>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, { id }) => (
        <div className="action-button">
          <Popconfirm
            title="Warning"
            description="Are you sure to delete"
            onConfirm={() => confirmDel(id)}
            okText="Yes"
            cancelText="No"
          >
            <Button>delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const confirmDel = (id) => {
    console.log(id);
    const newDish = Object.keys(selectedDishMap).reduce((acc, key) => {
      acc[key] = selectedDishMap[key].filter((dish) => dish.id !== id);
      return acc;
    }, {});
    console.log(newDish);
    setSelectedDishMap(newDish);
  };

  const showModal = () => {
    setOpen(true);
  };

  const handleOk = () => {
    setOpen(false);
  };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };
  const [value, setValue] = useState(1);
  const [dishList, setDishList] = useState([]);
  //get dish list
  const onChange = async (e) => {
    const res = await getDishListByCateId({ categoryId: e.target.value });
    setValue(e.target.value);
    setDishList(res.data.data);
  };
  //handle empty
  const [empty, setEmpty] = React.useState(false);

  useEffect(() => {
    dishList.length === 0 ? setEmpty(true) : setEmpty(false);
  }, [dishList]);
  //put1 dish list into table

  //set selected dishes

  const [selectedDishMap, setSelectedDishMap] = useState({});
  //create new map when value changed
  useEffect(() => {
    if (!selectedDishMap[value] && dishList.length > 0) {
      setSelectedDishMap({ ...selectedDishMap, [value]: [] });
    }
  }, [value]);

  const [selectedDish, setSelectedDish] = useState([]);
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      const newArr = selectedRows.map((e) => {
        return { ...e, copies: 1, dishId: e.id };
      });
      setSelectedDishMap({
        ...selectedDishMap,
        [value]: newArr.reverse(),
      });
    },
    selectedRowKeys: selectedDishMap[value]?.map((dish) => dish.dishId),
  };
  useEffect(() => {
    setSelectedDish(Object.values(selectedDishMap).flat());
  }, [selectedDishMap]);

  const delDishTag = (e) => {
    console.log(selectedDish);
    const arr = selectedDishMap[e.categoryId];
    console.log(arr);
    const newarr = arr.filter((item) => item.name !== e.name);

    console.log(newarr);
    setSelectedDishMap({
      ...selectedDishMap,
      [e.categoryId]: newarr,
    });
  };

  //handle title with id
  const [pathValue] = useSearchParams();
  const id = pathValue.get("id");
  const [title, setTitle] = useState("add");

  //handle form submit
  //add meal or update meal
  const navigate = useNavigate()
  const onFinish =async (values) => {
    
    if (!id) {
      setTitle('add')
      const params = {
        ...values,
        image:file[0].response.data,
        setmealDishes: selectedDish,
        status:0
      };
      try {
        const res = await addMeal(params);
        if (res.data.code === 1) {
          message.success("submit success");
          navigate("/setmeal");
        } else {
          message.error(res.data.msg);
          form.resetFields();
        }
      } catch (error) {
        message.error(error);
      }
    }
    else{
      setTitle('update')
      const params = {
        ...values,
        setmealDishes:selectedDish,
        image: file[0]?.response?.data || file[0]?.url || null,
        id:id
      }
      try {
        const res = await updateMeal(params);
        if (res.data.code === 1) {
          message.success("submit success");
          navigate("/setmeal");
        } else {
          message.error(res.data.msg);
          form.resetFields();
        }
      } catch (error) {
        message.error(error);
      }
    }
    
  };

  //file onUploadChange
  const [file, setFile] = useState([]);
  const onUploadChange = (info) => {
    setFile(info.fileList);
  };
  //handle data back

  useEffect(() => {
    async function getMeal(id) {
      const res = await getMealById(id);
      form.setFieldsValue(res.data.data);
      setFile([{ url: res.data.data.image }]);

      let transformedObject = {};

      // Iterate through each dish and organize them by dishCategoryId
      res.data.data.setmealDishes.forEach((dish) => {
        const { categoryId } = dish;

        // Check if the category already exists in the transformed object
        if (!transformedObject[categoryId]) {
          transformedObject[categoryId] = [];
        }

        // Push the dish details into the corresponding category array
        transformedObject[categoryId].push(dish);
      });
      setSelectedDishMap(transformedObject);
    }
    if (id) {
      getMeal(id);
    }
  }, [id, form]);
  useEffect(() => {
    if (selectedDish.length > 0) {
      setBodyTrigger(true);
    } else {
      setBodyTrigger(false);
    }
  }, [selectedDish.length]);

  //add meal

  return (
    <div className="add-dish">
      <HeadLabel title={title} goback={true}></HeadLabel>
      <div className="form-container">
        <Form
          validateTrigger={["onBlur"]}
          id="form"
          form={form}
          layout="horizontal"
          onFinish={onFinish}
          labelCol={{
            span: 4,
          }}
          wrapperCol={{
            span: 14,
          }}
          initialValues={{ addDish: selectedDish }}
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

          <Form.Item label="Add Dish" name="addDish">
            <div className="add-dish-container">
              {dishCategory.length > 0 ? (
                <div className="add-dish-meal">
                  <Button type="primary" onClick={showModal}>
                    +Add Dish
                  </Button>

                  <div className="add-dish-meal-container"></div>
                  <Modal
                    title="Add Dish To Meal "
                    open={open}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    width={1000}
                  >
                    <div className="add-dish-meal-container-left">
                      <Radio.Group onChange={onChange} value={value}>
                        {dishCategory.map((item, index) => {
                          return (
                            <div key={index} className="dishCategoy-item">
                              <Radio value={item.value}>{item.label}</Radio>
                            </div>
                          );
                        })}
                      </Radio.Group>
                    </div>
                    <div className="add-dish-meal-showDish">
                      <div className="dishlist-container">
                        <Table
                          columns={columns}
                          dataSource={empty ? [] : dishList}
                          rowKey="id"
                          rowSelection={{
                            type: Checkbox,
                            ...rowSelection,
                          }}
                          pagination={false}
                        />
                      </div>
                    </div>
                    <div className="selected-dish-contaiiner">
                      <label>
                        Selected dishes: <i> ({selectedDish.length})</i>
                      </label>
                      <div className="selected-dish">
                        {selectedDish.map((e, index) => (
                          <div key={index} className="selected-item flex">
                            <span>{e.name}</span>
                            <span>{e.price}</span>
                            <DeleteOutlined onClick={() => delDishTag(e)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Modal>

                  <div className="add-dish-meal-body">
                    {bodyTrigger && (
                      <div className="add-dish-table">
                        <Table
                          columns={dishColums}
                          dataSource={selectedDish}
                          rowKey="id"
                          pagination={false}
                        ></Table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </Form.Item>

          <Form.Item label="Category" name="categoryId">
            <Select options={mealCategory} />
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
            <Button type="default">Cancel</Button>
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
