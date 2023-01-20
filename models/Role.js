import mongoose from "mongoose";
const Schema = mongoose.Schema;

const RoleSchema = new Schema(
  {
    name: String,
  },
  { collection: "RoleCollection", timestamps: true }
);

const Role = mongoose.model("Role", RoleSchema);
export default Role;
