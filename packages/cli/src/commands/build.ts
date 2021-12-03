import { Command, flags } from '@oclif/command'
import * as path from 'path'
import webpack from 'webpack'
import { loadDestination } from '../lib/destinations'
import ora from 'ora'

// TODO app:dev that in injects builtins
// and their default implementations.
export default class Build extends Command {
  private spinner: ora.Ora = ora()

  static description = 'build and package a Segment app'

  static examples = [`$ ./bin/run app:build`]

  static flags = {
    help: flags.help({ char: 'h' }),
    dir: flags.string({
      char: 'd',
      description: 'directory of the app',
      default: './'
    })
  }

  // TODO Scope all things to a hash. Maybe commit + timestamp?
  // Or produce a hash ourselves but it's weird if it's not in parity with Github.
  // Maybe warn the user if they're compiling uncommited stuff?
  async run() {
    const {
      flags: { dir }
    } = this.parse(Build)

    this.spinner.start(`loading destination at ${dir}`)
    const destination = await loadDestination(dir)
    if (!destination) {
      this.spinner.fail()
      throw new Error(`no destination definition resolved at ${dir}`)
    }
    if (!destination.slug) {
      this.spinner.fail()
      throw new Error(`no slug defined for ${destination.name}}`)
    }
    if (!destination.version) {
      this.spinner.fail()
      throw new Error(`no version defined for ${destination.name}}`)
    }
    this.spinner.stop()

    // console.log(`${Object.keys(entries).length} functions to be built: ${Object.keys(entries).join(',')}`)

    const distDir = path.resolve(dir, '.segment', 'dist', destination.slug, destination.version)
    const pkg = require.resolve('@segment/action-destinations')
    const lastSlash = pkg.lastIndexOf('/', pkg.lastIndexOf('/') - 1)
    const tsconfig = path.resolve(pkg.slice(0, lastSlash), 'tsconfig.build.json')

    // Build the webpack config. Assumes a tsconfig.json exists if typescript is used.
    // TODO Support and ejectable webpack config and/or accept optional webpack config options
    // TODO Sourcemaps
    // TODO Maybe fail on no-nos? eg; process.env or window.* calls? This is mostly for
    // fail-fast-feedback and not for security.
    // NOTE We probably should not minify/uglify code for the sake of debugging and auditing
    // in the event of a bad actor.
    const config = {
      // target: 'node', // webworker for isolates
      target: 'node',
      mode: 'development',
      devtool: 'source-map',
      context: path.resolve(dir),
      entry: {
        app: path.resolve(dir, 'index.ts'),
        core: '@segment/actions-core'
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: [
              {
                loader: 'ts-loader',
                options: {
                  configFile: tsconfig
                }
              }
            ],
            exclude: /node_modules/
          }
        ]
      },
      resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules']
      },
      output: {
        filename: '[name].js',
        path: distDir,
        library: {
          type: 'commonjs'
        }
      }
    }

    await new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) {
          console.error(err)
          reject(err)
        }

        resolve(stats)
      })
    })

    console.log(`Segment app built and packaged at ${distDir}`)
  }
}