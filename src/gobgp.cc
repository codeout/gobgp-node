#include <stdlib.h>
#include <node.h>
#include <node_buffer.h>
#include "libgobgp.h"

using v8::Array;
using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void GetRouteFamily(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.Length() < 1) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  if (!args[0]->IsString()) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Invalid argument: Must be a String")));
    return;
  }

  int family = get_route_family(*String::Utf8Value(args[0]));

  args.GetReturnValue().Set(family);
}

void DecodePath(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.Length() < 1) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  if (!args[0]->IsObject()) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Invalid argument: Must be an Object")));
    return;
  }
  Local<Object> path_arg = args[0]->ToObject();
  Local<Value> nlri_arg = path_arg->Get(String::NewFromUtf8(isolate, "nlri"));
  Local<Value> pattrs_val = path_arg->Get(String::NewFromUtf8(isolate, "pattrs"));

  if (!pattrs_val->IsArray()) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Invalid argument: Value of \"pattrs\" must be an Array")));
    return;
  }
  Local<Array> pattrs_arg = Local<Array>::Cast(pattrs_val);

  buf nlri;
  nlri.value = node::Buffer::Data(nlri_arg);
  nlri.len = node::Buffer::Length(nlri_arg);

  buf* pattrs[pattrs_arg->Length()];
  for (int i = 0; i < (int)pattrs_arg->Length(); i++) {
    pattrs[i] = (buf*) malloc(sizeof(buf));
    pattrs[i]->value = node::Buffer::Data(pattrs_arg->Get(i));
    pattrs[i]->len = node::Buffer::Length(pattrs_arg->Get(i));
  }

  path path;
  path.nlri = nlri;
  path.path_attributes = pattrs;
  path.path_attributes_len = pattrs_arg->Length();

  args.GetReturnValue().Set(String::NewFromUtf8(isolate, decode_path(&path)));

  for (int i = 0; i < (int)pattrs_arg->Length(); i++)
    free(pattrs[i]);
}

void SerializePath(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.Length() < 2) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  if (!args[0]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Invalid argument: Must be a Number")));
    return;
  }
  if (!args[1]->IsString()) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Invalid argument: Must be a String")));
    return;
  }

  path* serialized = serialize_path(args[0]->NumberValue(), *String::Utf8Value(args[1]));
  if (!serialized)
    return;

  Local<Object> path = Object::New(isolate);
  path->Set(String::NewFromUtf8(isolate, "nlri"), node::Buffer::New(isolate, serialized->nlri.value, serialized->nlri.len).ToLocalChecked());

  Local<Array> pattrs = Array::New(isolate);
  for (int i = 0; i < serialized->path_attributes_len; i++) {
    pattrs->Set(i, node::Buffer::New(isolate, serialized->path_attributes[i]->value, serialized->path_attributes[i]->len).ToLocalChecked());
  }
  path->Set(String::NewFromUtf8(isolate, "pattrs"), pattrs);

  args.GetReturnValue().Set(path);
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "get_route_family", GetRouteFamily);
  NODE_SET_METHOD(exports, "decode_path", DecodePath);
  NODE_SET_METHOD(exports, "serialize_path", SerializePath);
}

NODE_MODULE(addon, init)
