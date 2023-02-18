import React, { useContext } from "react"
import { AppContext } from "./AppContext"
import ThemePicker from "./ThemePicker"
import MealPlanner from "./MealPlanner"

const Form: React.FC = () => {
  const context = useContext(AppContext)

  const onSubmitRequest = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    context.setIsSubmitted(true)
    const prompt = `Generate recipes with ingredients in JSON format for a pot luck dinner in the theme of ${
      context.theme
    } with ${
      context.mealPlan.appetizers
        ? context.mealPlan.appetizers + " appetizers, "
        : ""
    } ${
      context.mealPlan.mains ? context.mealPlan.mains + " main courses, " : ""
    } ${
      context.mealPlan.sides ? context.mealPlan.sides + " side dishes" : ""
    } ${
      context.mealPlan.desserts
        ? " and " + context.mealPlan.desserts + " desserts"
        : ""
    }. Your response must be in JSON format as {"Appetizers": Dish[],"Main Course": Dish[],"Side Dishes": Dish[],"Dessert": Dish[]} where type Dish = { name: string; ingredients: string[]}.`
    const tokens =
      (context.mealPlan.appetizers +
        context.mealPlan.mains +
        context.mealPlan.sides +
        context.mealPlan.desserts) *
        200 +
      Math.ceil(prompt.length / 4)
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        tokens: tokens > 2048 ? 2048 : tokens,
      }),
    })

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    // This data is a ReadableStream
    const data = response.body
    if (!data) {
      return
    }

    const reader = data.getReader()
    const decoder = new TextDecoder()
    let done = false
    let isJson = null

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      if (isJson === null && chunkValue.length) {
        // check that this is JSON, if not then need to retry
        isJson = chunkValue.charAt(0) === "{"
        if (!isJson) {
          done = true
          console.log({ chunkValue })
          alert("Sorry there was an error with the robot. Please try again.")
        }
      }
      context.setGeneratedPotLuck(chunkValue)
    }

    context.incrementTokensUsed(
      (prompt.length + context.generatedPotLuck.length) / 4
    )
    console.log("ingredients complete", context.potLuckData)
    context.setIngredientsComplete(true)
  }

  return (
    <form
      className={`pb-16 mx-auto ${context.isSubmitted ? "hidden" : ""}`}
      onSubmit={onSubmitRequest}
    >
      <div>
        <ThemePicker />
        <MealPlanner />
        <button
          type="submit"
          className="bg-primary-500 rounded-xl text-white font-medium text-xl sm:text-3xl py-4 pl-12 pr-16 mt-2"
          style={{
            boxShadow: "inset 0 0 90px #5C2300",
            textShadow: "0 0 2px rgb(0 0 0 / 80%)",
          }}
        >
          <span className="inline-block relative">
            Generate Your Recipes{" "}
            <span className="font-thin text-4xl absolute -top-2 -right-8 pt-px">
              »
            </span>
          </span>
        </button>
      </div>
    </form>
  )
}

export default Form
