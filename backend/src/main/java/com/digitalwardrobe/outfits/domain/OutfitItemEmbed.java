package com.digitalwardrobe.outfits.domain;

public class OutfitItemEmbed {

    private String itemId;
    private String type;
    private double positionX;
    private double positionY;
    private double scale;
    private double rotation;
    private int zIndex;

    public OutfitItemEmbed() {
    }

    public OutfitItemEmbed(String itemId, String type, double positionX, double positionY,
            double scale, double rotation, int zIndex) {
        this.itemId = itemId;
        this.type = type;
        this.positionX = positionX;
        this.positionY = positionY;
        this.scale = scale;
        this.rotation = rotation;
        this.zIndex = zIndex;
    }

    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public double getPositionX() {
        return positionX;
    }

    public void setPositionX(double positionX) {
        this.positionX = positionX;
    }

    public double getPositionY() {
        return positionY;
    }

    public void setPositionY(double positionY) {
        this.positionY = positionY;
    }

    public double getScale() {
        return scale;
    }

    public void setScale(double scale) {
        this.scale = scale;
    }

    public double getRotation() {
        return rotation;
    }

    public void setRotation(double rotation) {
        this.rotation = rotation;
    }

    public int getZIndex() {
        return zIndex;
    }

    public void setZIndex(int zIndex) {
        this.zIndex = zIndex;
    }
}
