import React from "react";
import {
  Form,
  Button,
  Input,
  Notification,
  Radio,
  Progress,
} from "element-react";
import { Storage, Auth, API, graphqlOperation } from "aws-amplify";
import { createProduct } from "../graphql/mutations";
import { PhotoPicker } from "aws-amplify-react";
import aws_exports from "../aws-exports";
import { convertDollarsToCents } from "../utils";

const initialState = {
  description: "",
  price: "",
  shipped: false,
  imagePreview: "",
  image: "",
  isUploading: false,
};
class NewProduct extends React.Component {
  state = { ...initialState };

  handleAddProduct = async () => {
    try {
      this.setState({ isUploading: true });
      const visibility = "public";
      const { identityId } = await Auth.currentCredentials();
      const filename = `/${visibility}/${identityId}/${Date.now()}-${this.state.image.name
        }`;
      const uploadedFile = await Storage.put(filename, this.state.image.file, {
        contentType: this.state.image.type,
      });
      const file = {
        key: uploadedFile.key,
        bucket: aws_exports.aws_user_files_s3_bucket,
        region: aws_exports.aws_project_region,
      };
      const input = {
        productMarketId: this.props.marketId,
        description: this.state.description,
        shipped: this.state.shipped,
        price: convertDollarsToCents(this.state.price),
        file,
      };
      const result = await API.graphql(
        graphqlOperation(createProduct, { input })
      );
      console.log("Created product", result);
      Notification({
        title: "Success",
        message: "Product successfully created!",
        type: "success",
      });
      this.setState({ ...initialState });
    } catch (err) {
      Notification({
        title: "Failed",
        message: err,
        type: "warning",
      });
      console.error("Error adding product", err);
    }
  };

  render() {
    const {
      description,
      price,
      image,
      shipped,
      imagePreview,
      isUploading,
    } = this.state;
    return (
      <div className="flex-center">
        <h2 className="header">Add New Product </h2>
        <div>
          <Form className="market-header">
            <Form.Item label="Add Product Description">
              <Input
                type="text"
                icon="information"
                value={description}
                placeholder="Description"
                onChange={(description) => this.setState({ description })}
              />
            </Form.Item>
            <Form.Item label="Set Product Price">
              <Input
                type="number"
                icon="plus"
                value={price}
                placeholder="Price ($USD)"
                onChange={(price) => this.setState({ price })}
              />
            </Form.Item>
            <Form.Item label="Is the Product Shipped or Emailed to the Customer?">
              <div className="text-center">
                <Radio
                  value="true"
                  checked={shipped}
                  onChange={() => this.setState({ shipped: true })}
                >
                  Shipped
                </Radio>
                <Radio
                  value="true"
                  checked={!shipped}
                  onChange={() => this.setState({ shipped: false })}
                >
                  Emailed
                </Radio>
              </div>
            </Form.Item>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Product Preview"
                className="image-preview"
              />
            )}
            <PhotoPicker
              title="Product Image"
              preview="hidden"
              onLoad={(url) => this.setState({ imagePreview: url })}
              onPick={(file) => this.setState({ image: file })}
              theme={{
                formContainer: {
                  margin: 0,
                  padding: "0.8em",
                },
                formSection: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                },
                sectionBody: {
                  margin: 0,
                  width: "250px",
                },
                sectionHeader: {
                  padding: "0.3em",
                  color: "var(--darkAmazonOrange)",
                },
                photoPickerButton: {
                  display: "none",
                },
              }}
            />
            <Form.Item>
              <Button
                disabled={!image || !description || !price || isUploading}
                type="primary"
                onClick={this.handleAddProduct}
                loading={isUploading}
              >
                {isUploading ? "Uploading ... " : "Add Product"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  }
}

export default NewProduct;
