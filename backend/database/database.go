package database

import (
	"fmt"
	"github.com/go-playground/validator/v10"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB
var VL = validator.New()

func Connect() {
	db, err := gorm.Open(sqlite.Open("sql.db"))

	if err != nil {
		fmt.Println("DB connection error")
	}

	DB = db

	fmt.Println("DB connected successfully")

}
