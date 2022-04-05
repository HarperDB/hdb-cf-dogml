# hdb-cf-dogml
A HarperDB Custom Function project for training a model and classifying inbound images

## Install


Just clone this repository into your `custom_functions` folder (by default, this is located in `~/hdb/custom_functions`)

```
git clone https://github.com/HarperDB/hdb-cf-dogml.git ~/hdb/custom_functions/mldog
```

Then restart your Custom Functions server for the routes to take effect.

## Use


There are several endpoints. 

### /setup

This creates a demo schema and the necessary tables in HarperDB.

### /train

Trains the model using the CPU.

### /train_gpu

Trains the model using the GPU.

### /classify

Takes the inbound image and classifies it using the most recent model.

### /reset

Resets all data, and removes all models.


## Upload UI


This app has a built in UI for uploading images to be classified. You can reach it at:

https://MY_CF_SEVER_URL/mldog/ui
