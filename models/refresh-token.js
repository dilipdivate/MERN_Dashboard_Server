import mongoose from "mongoose";
const Schema = mongoose.Schema;

const RefreshTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  token: String,
  expires: Date,
  created: { type: Date, default: Date.now },
  revoked: Date,
  replacedByToken: String,
});

RefreshTokenSchema.virtual("isExpired").get(function () {
  return Date.now() >= this.expires;
});

RefreshTokenSchema.virtual("isActive").get(function () {
  return !this.revoked && !this.isExpired;
});

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;
