# ESO Price Checker

The tool checks whether the prices of certain items are at the desired level every five minutes using TTC data. Currently, it only works on Windows without any problem.

## Starting Development

Start the app in the dev environment:

```shell
npm start
```

## Packaging for Production

To package apps for the local platform:

```shell
npm run package
```

## Troubleshooting

Sometimes, price checking fails because TTC requires ReCaptcha verification. Since ReCaptcha is designed to prevent automated processes, it cannot be handled automatically. Therefore, you need to visit the TTC website and verify the captcha manually. Once you've completed the verification, you should be able to resume checking prices after restarting the program.
