
API_KEY = "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"

from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=API_KEY,
)

completion = client.chat.completions.create(
  extra_body={},
  model="deepseek/deepseek-chat-v3-0324:free",
  messages=[
    {
      "role": "user",
      "content": """
      This is the transcript of a video/podcast episode. Please summarize it with timestamp on main topic.\n
      
      [00:00:00 --> 00:00:01]  to love cuisson.
      [00:00:01 --> 00:00:03]  Stay with me and I'll show you how to do it.
      [00:00:03 --> 00:00:06]  And what I'm gonna do today is cook every sort of generic
      [00:00:06 --> 00:00:08]  cuisson of steak at the same time,
      [00:00:08 --> 00:00:09]  so we can see the difference.
      [00:00:09 --> 00:00:13]  And I can show you exactly how in restaurants we do it.
      [00:00:13 --> 00:00:14]  These are six fillets.
      [00:00:14 --> 00:00:18]  Fillets are the best steak to show the cuisson
      [00:00:18 --> 00:00:20]  because they're the leanest.
      [00:00:20 --> 00:00:23]  So there's very little fat running through them.
      [00:00:23 --> 00:00:25]  So it makes them perfect to show
      [00:00:25 --> 00:00:27]  for this sort of control test.
      [00:00:27 --> 00:00:29]  I would say my big fatties,
      [00:00:29 --> 00:00:31]  so really nice.
      """
    }
  ]
)
print(completion.choices[0].message.content)